import { exec } from 'child_process';
import { promises as fs } from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';

import { 
  initializeDatabase,
  ShipRepository,
  PilotRepository,
  UpgradeRepository,
  PilotRestrictionRepository,
  UpgradeRestrictionRepository
} from '../database';
import { transformPilotsForDb } from './pilots';
import { transformShipsForDb } from './ships';
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
    const { pilotsById, ships, upgrades } = basicCardData;

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
        for (const [restrictionType, restrictionValue] of Object.entries(pilot.restrictions)) {
          const values = Array.isArray(restrictionValue) ? restrictionValue : [restrictionValue];
          pilotRestrictionRepo.create(hydratedPilot.id, restrictionType, 'equals', values);
        }
      }
    }

    console.log('Transforming and seeding upgrades...');
    const transformedUpgrades = transformUpgradesForDb(upgrades);
    for (const upgrade of transformedUpgrades) {
      const hydratedUpgrade = upgradeRepo.create(upgrade);
      
      if (upgrade.upgradeRestrictions) {
        for (const [restrictionType, restrictionValue] of Object.entries(upgrade.upgradeRestrictions)) {
          const values = Array.isArray(restrictionValue) ? restrictionValue : [restrictionValue];
          upgradeRestrictionRepo.create(hydratedUpgrade.id, restrictionType, 'equals', values);
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