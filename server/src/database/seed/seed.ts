import { db } from '../database';
import {
  initializeDatabase,
  ShipRepository,
  PilotRepository,
  UpgradeRepository,
  PilotRestrictionRepository,
  UpgradeRestrictionRepository,
} from '../database';
import { transformPilotsForDb } from './pilots';
import { transformShipsForDb } from './ships';
import { transformUpgradesForDb } from './upgrades';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';

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

    const shipRepo = new ShipRepository();
    const pilotRepo = new PilotRepository();
    const upgradeRepo = new UpgradeRepository();
    const pilotRestrictionRepo = new PilotRestrictionRepository();
    const upgradeRestrictionRepo = new UpgradeRestrictionRepository();

    console.log('Transforming and seeding ships...');
    const transformedShips = transformShipsForDb(ships);
    for (const ship of transformedShips) {
      shipRepo.create(ship);
    }

    console.log('Transforming and seeding pilots...');
    const transformedPilots = transformPilotsForDb(pilotsById);
    for (const pilot of transformedPilots) {
      const hydratedPilot = pilotRepo.create(pilot);

      if (pilot.restrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(
          pilot.restrictions
        )) {
          const values = Array.isArray(restrictionValue)
            ? restrictionValue
            : [restrictionValue];
          pilotRestrictionRepo.create(
            hydratedPilot.id,
            restrictionType,
            'equals',
            values
          );
        }
      }
    }

    console.log('Transforming and seeding upgrades...');
    const transformedUpgrades = transformUpgradesForDb(upgradesById);
    for (const upgrade of transformedUpgrades) {
      const hydratedUpgrade = upgradeRepo.create(upgrade);

      if (upgrade.upgradeRestrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(
          upgrade.upgradeRestrictions
        )) {
          const values = Array.isArray(restrictionValue)
            ? restrictionValue
            : [restrictionValue];
          upgradeRestrictionRepo.create(
            hydratedUpgrade.id,
            restrictionType,
            'equals',
            values
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

  console.log(
    `Found ${pilotsNeedingSlots.length} pilots needing slot backfill`
  );

  const updatePilotSlots = db.prepare(`
    UPDATE pilots SET slots = ? WHERE id = ?
  `);

  let updatedCount = 0;

  for (const pilot of pilotsNeedingSlots) {
    try {
      const upgradeNames = JSON.parse(pilot.upgrades) as string[];
      const derivedSlots = new Set<string>();

      for (const upgradeName of upgradeNames) {
        // Find upgrade by name
        const upgrade = db
          .prepare(
            `
          SELECT id FROM upgrades WHERE name = ?
        `
          )
          .get(upgradeName) as { id: number } | undefined;

        if (!upgrade) {
          console.warn(
            `Upgrade not found: ${upgradeName} for pilot ${pilot.name}`
          );
          continue;
        }

        // Get upgrade restrictions for 'slots' type
        const slotsRestrictions = db
          .prepare(
            `
          SELECT restriction_values 
          FROM upgrade_restrictions 
          WHERE upgrade_id = ? AND restriction_type = 'slots'
        `
          )
          .all(upgrade.id) as Array<{ restriction_values: string }>;

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
        console.log(
          `Updated ${pilot.name}: added slots [${slotsArray.join(', ')}]`
        );
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
