import { initializeDatabase, ShipRepository, Ship } from './database';
import fs from 'fs';
import path from 'path';

const shipRepo = new ShipRepository();

// Path to yasb CoffeeScript file
const YASB_CARDS_PATH = path.join(__dirname, '../../../yasb/coffeescripts/content/cards-common.coffee');

function parseCoffeeScriptShips(): Omit<Ship, 'id' | 'created_at'>[] {
  console.log('Reading CoffeeScript file:', YASB_CARDS_PATH);
  
  if (!fs.existsSync(YASB_CARDS_PATH)) {
    throw new Error(`YASB cards file not found at: ${YASB_CARDS_PATH}`);
  }

  const coffeeContent = fs.readFileSync(YASB_CARDS_PATH, 'utf8');
  
  // Find the ships section - look for "ships:" followed by ship definitions
  const shipsMatch = coffeeContent.match(/ships:\s*\n([\s\S]*?)(?=\n\s*\w+:|\n\w|\nexpor|\Z)/);
  
  if (!shipsMatch) {
    throw new Error('Could not find ships section in CoffeeScript file');
  }

  const shipsSection = shipsMatch[1];
  const ships: Omit<Ship, 'id' | 'created_at'>[] = [];
  
  // Parse each ship definition
  const shipMatches = shipsSection.matchAll(/"([^"]+)":\s*\n([\s\S]*?)(?=\n\s{8}"|\n\s{4}\w|\Z)/g);
  
  for (const shipMatch of shipMatches) {
    const shipName = shipMatch[1];
    const shipData = shipMatch[2];
    
    try {
      const ship = parseShipData(shipName, shipData);
      ships.push(ship);
      console.log(`Parsed ship: ${ship.name}`);
    } catch (error) {
      console.error(`Error parsing ship ${shipName}:`, error);
    }
  }
  
  return ships;
}

function parseShipData(shipName: string, shipData: string): Omit<Ship, 'id' | 'created_at'> {
  const ship: any = {
    name: shipName,
    factions: [],
    actions: [],
    maneuvers: [],
  };

  // Parse basic properties
  const nameMatch = shipData.match(/name:\s*"([^"]+)"/);
  if (nameMatch) ship.name = nameMatch[1];

  const attackMatch = shipData.match(/attack:\s*(\d+)/);
  if (attackMatch) ship.attack = parseInt(attackMatch[1]);

  const agilityMatch = shipData.match(/agility:\s*(\d+)/);
  if (agilityMatch) ship.agility = parseInt(agilityMatch[1]);

  const hullMatch = shipData.match(/hull:\s*(\d+)/);
  if (hullMatch) ship.hull = parseInt(hullMatch[1]);

  const shieldsMatch = shipData.match(/shields:\s*(\d+)/);
  if (shieldsMatch) ship.shields = parseInt(shieldsMatch[1]);

  const chassisMatch = shipData.match(/chassis:\s*"([^"]+)"/);
  if (chassisMatch) ship.chassis = chassisMatch[1];

  // Parse factions array
  const factionsMatch = shipData.match(/factions:\s*\[\s*([\s\S]*?)\s*\]/);
  if (factionsMatch) {
    const factionsContent = factionsMatch[1];
    const factionMatches = factionsContent.matchAll(/"([^"]+)"/g);
    ship.factions = Array.from(factionMatches, match => match[1]);
  }

  // Parse actions array
  const actionsMatch = shipData.match(/actions:\s*\[\s*([\s\S]*?)\s*\](?=\s*\n\s*maneuvers|\s*\n\s*autoequip|\s*\n\s*\w+:|\s*$)/);
  if (actionsMatch) {
    const actionsContent = actionsMatch[1];
    const actionMatches = actionsContent.matchAll(/"([^"]+)"/g);
    ship.actions = Array.from(actionMatches, match => match[1]);
  }

  // Parse maneuvers 2D array
  const maneuversMatch = shipData.match(/maneuvers:\s*\[\s*([\s\S]*?)\s*\](?=\s*\n\s*autoequip|\s*\n\s*\w+:|\s*$)/);
  if (maneuversMatch) {
    const maneuversContent = maneuversMatch[1];
    const rowMatches = maneuversContent.matchAll(/\[\s*([\d\s,]+)\s*\]/g);
    ship.maneuvers = Array.from(rowMatches, match => {
      return match[1].split(/[,\s]+/).filter(n => n).map(Number);
    });
  }

  // Parse autoequip array (optional)
  const autoequipMatch = shipData.match(/autoequip:\s*\[\s*([\s\S]*?)\s*\]/);
  if (autoequipMatch) {
    const autoequipContent = autoequipMatch[1];
    const autoequipMatches = autoequipContent.matchAll(/"([^"]+)"/g);
    ship.autoequip = Array.from(autoequipMatches, match => match[1]);
  }

  // Validate required fields
  if (!ship.name || ship.attack === undefined || ship.agility === undefined || 
      ship.hull === undefined || ship.shields === undefined || 
      !ship.factions.length || !ship.actions.length || !ship.maneuvers.length) {
    throw new Error(`Missing required fields for ship: ${shipName}`);
  }

  return ship;
}

export function seedDatabase() {
  console.log('Seeding database from YASB CoffeeScript file...');
  
  try {
    const ships = parseCoffeeScriptShips();
    console.log(`Found ${ships.length} ships to import`);
    
    let created = 0;
    let skipped = 0;
    
    for (const ship of ships) {
      try {
        shipRepo.create(ship);
        created++;
        console.log(`✓ Created ship: ${ship.name}`);
      } catch (error) {
        skipped++;
        console.log(`- Ship ${ship.name} already exists, skipping...`);
      }
    }
    
    console.log(`Database seeding completed: ${created} created, ${skipped} skipped`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Initialize and seed if called directly
if (require.main === module) {
  initializeDatabase();
  seedDatabase();
}