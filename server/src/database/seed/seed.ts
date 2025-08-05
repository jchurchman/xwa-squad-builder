import { exec } from 'child_process';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';

import { db } from '../database';
import {
  initializeDatabase,
  PilotRepository,
  PilotRestrictionRepository,
  PlatformRepository,
  UpgradeRepository,
  UpgradeRestrictionRepository,
} from '../database';
import { transformPilotsForDb } from './pilots';
import { transformPlatformsForDb } from './platforms';
import { transformUpgradesForDb } from './upgrades';

const YASB_CARDS_URL =
  'https://raw.githubusercontent.com/jchurchman/yasb/master/coffeescripts/content/cards-common.coffee';

const execAsync = promisify(exec);

const fetchFile = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
};

const decaffeinate = async (coffeeCode: string): Promise<string> => {
  await fs.writeFile('temp.coffee', coffeeCode);
  await execAsync('npx decaffeinate temp.coffee');
  const jsCode = await fs.readFile('temp.js', 'utf8');

  await fs.unlink('temp.coffee');
  await fs.unlink('temp.js');

  return jsCode;
};

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Fetching data from YASB...');
    const coffeeCode = await fetchFile(YASB_CARDS_URL);

    console.log('Converting CoffeeScript to JavaScript...');
    let jsCode = await decaffeinate(coffeeCode);
    jsCode = jsCode.replace(/\.canonicalize\(\)/g, '');
    const tempPath = path.join(__dirname, 'temp-data.js');
    await fs.writeFile(tempPath, jsCode);

    const rawDataModule = await import(tempPath);
    const rawData = rawDataModule.default || rawDataModule;
    const basicCardData = rawData.basicCardData();
    const { pilotsById, ships, upgradesById } = basicCardData;

    const platformRepo = new PlatformRepository();
    const pilotRepo = new PilotRepository();
    const upgradeRepo = new UpgradeRepository();
    const pilotRestrictionRepo = new PilotRestrictionRepository();
    const upgradeRestrictionRepo = new UpgradeRestrictionRepository();

    console.log('Transforming and seeding upgrades...');
    const transformedUpgrades = transformUpgradesForDb(upgradesById);
    const upgradeNameToIdMap = new Map<string, number>();

    for (const upgrade of transformedUpgrades) {
      const hydratedUpgrade = upgradeRepo.create(upgrade);
      upgradeNameToIdMap.set(upgrade.name, hydratedUpgrade.id);

      if (upgrade.upgradeRestrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(
          upgrade.upgradeRestrictions
        )) {
          upgradeRestrictionRepo.create(
            hydratedUpgrade.id,
            restrictionType,
            'equals',
            restrictionValue
          );
        }
      }
    }

    console.log('Transforming and seeding platforms...');
    const transformedPlatforms = transformPlatformsForDb(ships);
    for (const platform of transformedPlatforms) {
      let upgradeIds: number[] | undefined;
      if (platform.autoequip) {
        upgradeIds = platform.autoequip
          .map((upgradeName) => upgradeNameToIdMap.get(upgradeName))
          .filter((id): id is number => id !== undefined);

        const missingUpgrades = platform.autoequip.filter((name) => !upgradeNameToIdMap.has(name));
        if (missingUpgrades.length > 0) {
          console.warn(
            `Platform ${platform.name}: Missing upgrades: ${missingUpgrades.join(', ')}`
          );
        }
      }

      platformRepo.create({
        ...platform,
        autoequip: upgradeIds,
      });
    }

    console.log('Transforming and seeding pilots...');
    const transformedPilots = transformPilotsForDb(pilotsById);
    for (const pilot of transformedPilots) {
      let upgradeIds: number[] | undefined;
      if (pilot.upgrades) {
        upgradeIds = pilot.upgrades
          .map((upgradeName) => upgradeNameToIdMap.get(upgradeName))
          .filter((id): id is number => id !== undefined);

        // Log missing upgrades for debugging
        const missingUpgrades = pilot.upgrades.filter((name) => !upgradeNameToIdMap.has(name));
        if (missingUpgrades.length > 0) {
          console.warn(`Pilot ${pilot.name}: Missing upgrades: ${missingUpgrades.join(', ')}`);
        }
      }

      let derivedSlots = pilot.slots;
      let isStandard = false;
      if ((!pilot.slots || pilot.slots.length === 0) && upgradeIds && upgradeIds.length > 0) {
        const slotsSet = [];

        for (const upgradeId of upgradeIds) {
          const standardRestrictions = db
            .prepare(
              `SELECT restriction_values 
               FROM upgrade_restrictions 
               WHERE upgrade_id = ? AND restriction_type = 'standard'`
            )
            .all(upgradeId) as Array<{ restriction_values: string }>;

          if (standardRestrictions.length > 0) {
            const standardValue = JSON.parse(standardRestrictions[0].restriction_values);
            if (
              standardValue === true ||
              (Array.isArray(standardValue) && standardValue[0] === true)
            ) {
              isStandard = true;
            }
          }

          const slotsRestrictions = db
            .prepare(
              `SELECT restriction_values 
               FROM upgrade_restrictions 
               WHERE upgrade_id = ? AND restriction_type = 'slots'`
            )
            .all(upgradeId) as Array<{ restriction_values: string }>;

          for (const restriction of slotsRestrictions) {
            const values = JSON.parse(restriction.restriction_values) as string[];
            if (values.length > 0) {
              slotsSet.push(values[0]);
            }
          }
        }

        derivedSlots = slotsSet;
        if (derivedSlots.length > 0) {
          console.log(
            `Pilot ${pilot.name}: Derived slots [${derivedSlots.join(', ')}] from upgrades`
          );
        }
      }

      const pilotWithIds = {
        ...pilot,
        slots: derivedSlots,
        standard: isStandard,
        upgrades: upgradeIds,
      };

      const hydratedPilot = pilotRepo.create(pilotWithIds);

      if (pilot.restrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(pilot.restrictions)) {
          pilotRestrictionRepo.create(
            hydratedPilot.id,
            restrictionType,
            'equals',
            restrictionValue
          );
        }
      }
    }

    console.log('Database seeded successfully!');
    await fs.unlink(tempPath);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  (async () => {
    console.log('Initializing database...');
    initializeDatabase();
    await seedDatabase();
    console.log('Seeding complete!');
  })();
}
