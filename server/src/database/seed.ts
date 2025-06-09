import { initializeDatabase, ShipRepository, Ship, PilotRepository } from './database';
import { parseCoffeeScriptPilots } from './pilots';
import { parseCoffeeScriptShips } from './ships';

const YASB_CARDS_URL = 'https://raw.githubusercontent.com/jchurchman/yasb/master/coffeescripts/content/cards-common.coffee';

async function fetchCoffeeScriptText(): Promise<string> {
  console.log('Fetching CoffeeScript file from:', YASB_CARDS_URL);
  const response = await fetch(YASB_CARDS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const coffeeContent = await response.text();

    return coffeeContent
}


export async function seedDatabase() {
  console.log('Seeding database from YASB CoffeeScript file...');
  
  const shipRepo = new ShipRepository();
  const pilotRepo = new PilotRepository();
  
  try {
    const coffeeScriptText = await fetchCoffeeScriptText();

    const ships = await parseCoffeeScriptShips(coffeeScriptText);
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

    const pilots = await parseCoffeeScriptPilots(coffeeScriptText);
    console.log(`Found ${pilots.length} pilots to import`);
    
    for (const pilot of pilots) {
      try {
        pilotRepo.create(pilot)
        created++;
        console.log(`Created pilot: ${pilot.name}`);
      } catch(error) {
        skipped++;
        console.log(`- Pilot ${pilot.name} already exists, skipping...`)
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
  (async () => {
    initializeDatabase();
    await seedDatabase();
  })()
}