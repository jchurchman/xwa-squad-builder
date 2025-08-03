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

import { Pilot } from '@shared/types';

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

    console.log('Transforming and seeding platforms...');
    const transformedPlatforms = transformPlatformsForDb(ships);
    for (const platform of transformedPlatforms) {
      platformRepo.create(platform);
    }

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
          const values = Array.isArray(restrictionValue) ? restrictionValue : [restrictionValue];
          upgradeRestrictionRepo.create(hydratedUpgrade.id, restrictionType, 'equals', values);
        }
      }
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

      const pilotWithIds: Pilot = {
        ...pilot,
        upgrades: upgradeIds,
      };

      const hydratedPilot = pilotRepo.create(pilotWithIds);

      if (pilot.restrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(pilot.restrictions)) {
          const values = Array.isArray(restrictionValue) ? restrictionValue : [restrictionValue];
          pilotRestrictionRepo.create(hydratedPilot.id, restrictionType, 'equals', values);
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

const backfillPilotSlots = (): void => {
  console.log('Starting pilot slots backfill...');

  // Get all pilots with empty slots but non-empty upgrades
  const pilotsNeedingSlots = db
    .prepare(
      `
    SELECT id, name, upgrades 
    FROM pilots 
    WHERE slots = '[]' AND upgrades IS NOT NULL AND upgrades != '[]'
  `
    )
    .all() as Array<{ id: number; name: string; upgrades: string }>;

  console.log(`Found ${pilotsNeedingSlots.length} pilots needing slot backfill`);

  const updatePilotSlots = db.prepare(`
    UPDATE pilots SET slots = ? WHERE id = ?
  `);

  let updatedCount = 0;

  for (const pilot of pilotsNeedingSlots) {
    try {
      const upgradeIds = JSON.parse(pilot.upgrades) as number[];
      const derivedSlots = new Set<string>();

      for (const upgradeId of upgradeIds) {
        // Get upgrade restrictions for 'slots' type
        const slotsRestrictions = db
          .prepare(
            `
          SELECT restriction_values 
          FROM upgrade_restrictions 
          WHERE upgrade_id = ? AND restriction_type = 'slots'
        `
          )
          .all(upgradeId) as Array<{ restriction_values: string }>;

        // Extract first value from each slots restriction
        for (const restriction of slotsRestrictions) {
          const values = JSON.parse(restriction.restriction_values) as string[];
          if (values.length > 0) {
            derivedSlots.add(values[0]);
          }
        }
      }

      if (derivedSlots.size > 0) {
        const slotsArray = Array.from(derivedSlots);
        updatePilotSlots.run(JSON.stringify(slotsArray), pilot.id);
        updatedCount++;
        console.log(`Updated ${pilot.name}: added slots [${slotsArray.join(', ')}]`);
      } else {
        console.warn(`No slots derived for pilot ${pilot.name}`);
      }
    } catch (error) {
      console.error(`Error processing pilot ${pilot.name}:`, error);
    }
  }

  console.log(`Backfill complete: updated ${updatedCount} pilots`);
};

if (require.main === module) {
  (async () => {
    console.log('Initializing database...');
    initializeDatabase();
    await seedDatabase();
    backfillPilotSlots();
    console.log('Seeding complete!');
  })();
}
