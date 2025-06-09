import { Ship } from "./database";

export async function parseCoffeeScriptShips(coffeeScriptText: string): Promise<Omit<Ship, 'id' | 'created_at'>[]> {
  try {
    const shipsMatchRegex = new RegExp(/(\s{4}ships:\n)((.*\n)*)(\s{8}# Epic Section)/gm)
    const shipsMatch = coffeeScriptText.match(shipsMatchRegex);
    
    if (!shipsMatch) {
      throw new Error('Could not find ships section in CoffeeScript file');
    }

    const entries = shipsMatch[0].replace("# Epic Section", "").trim().replace("ships:", "").split(/\s{8}\".*":\n/);
    
    const ships: Omit<Ship, 'id' | 'created_at'>[] = [];
    
    for (const shipData of entries) {
      try {
        const isHyperspaceRing = shipData.match(/Syliure/)
        if (isHyperspaceRing) continue
        const ship = parseShipData(shipData);
        ships.push(ship);
        console.log(`Parsed ship: ${ship.name}`);
      } catch (error) {
        console.error(`Error parsing ship:`, error);
      }
    }
    
    return ships;
  } catch (error) {
    console.error('Error parsing CoffeeScript file for ships:', error);
    throw error;
  }
}

const attackTypes = [
  "attack",
  "attackdt",
  "attackt",
  "attackf",
  "attackbull"
]

function parseShipData(shipData: string): Omit<Ship, 'id' | 'created_at'> {
  const ship: any = {
    name: "",
    base: "Small",
    factions: [],
    actions: [],
    maneuvers: [],
  };

  const nameMatch = shipData.match(/name:\s*"([^"]+)"/);
  if (nameMatch) ship.name = nameMatch[1];

  attackTypes.forEach(atkType => {
    const match = shipData.match(new RegExp(`${atkType}:\\s*(\\d+)`))
    if (match) ship[atkType] = parseInt(match[1])
  })

  const agilityMatch = shipData.match(/agility:\s*(\d+)/);
  if (agilityMatch) ship.agility = parseInt(agilityMatch[1]);

  const baseMatch = shipData.match(/base:\s*(\d+)/);
  if (baseMatch) ship.base = baseMatch[1]

  const hullMatch = shipData.match(/hull:\s*(\d+)/);
  if (hullMatch) ship.hull = parseInt(hullMatch[1]);

  const shieldsMatch = shipData.match(/shields:\s*(\d+)/);
  if (shieldsMatch) ship.shields = parseInt(shieldsMatch[1]);

  const chassisMatch = shipData.match(/chassis:\s*"([^"]+)"/);
  if (chassisMatch) ship.chassis = chassisMatch[1];

  const factionsMatch = shipData.match(/factions:\s*\[\s*([\s\S]*?)\s*\]/);
  if (factionsMatch) {
    const factionsContent = factionsMatch[1];
    const factionMatches = factionsContent.matchAll(/"([^"]+)"/g);
    ship.factions = Array.from(factionMatches, match => match[1]);
  }

  const actionsMatch = shipData.match(/actions:\s*\[\s*([\s\S]*?)\s*\](?=\s*\n\s*maneuvers|\s*\n\s*autoequip|\s*\n\s*\w+:|\s*$)/);
  if (actionsMatch) {
    const actionsContent = actionsMatch[1];
    const actionMatches = actionsContent.matchAll(/"([^"]+)"/g);
    ship.actions = Array.from(actionMatches, match => match[1]);
  }

  const maneuversMatch = shipData.match(/maneuvers:\s*\[\s*([\s\S]*?)\s*\](?=\s*\n\s*autoequip|\s*\n\s*\w+:|\s*$)/);
  if (maneuversMatch) {
    const maneuversContent = maneuversMatch[1];
    const rowMatches = maneuversContent.matchAll(/\[\s*([\d\s,]+)\s*\]/g);
    ship.maneuvers = Array.from(rowMatches, match => {
      return match[1].split(/[,\s]+/).filter(n => n).map(Number);
    });
  }

  const autoequipMatch = shipData.match(/autoequip:\s*\[\s*([\s\S]*?)\s*\]/);
  if (autoequipMatch) {
    const autoequipContent = autoequipMatch[1];
    const autoequipMatches = autoequipContent.matchAll(/"([^"]+)"/g);
    ship.autoequip = Array.from(autoequipMatches, match => match[1]);
  }

  if (!ship.name || (attackTypes.every(t => ship[t] === undefined)) || ship.agility === undefined || 
      ship.hull === undefined || ship.shields === undefined || 
      !ship.factions.length || !ship.actions.length || !ship.maneuvers.length) {
    throw new Error(`Missing required fields for ship: ${ship.name}`);
  }

  return ship;
}
