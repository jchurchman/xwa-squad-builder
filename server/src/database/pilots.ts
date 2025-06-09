import { Pilot } from "./database";

export async function parseCoffeeScriptPilots(coffeeScriptText: string): Promise<Omit<Pilot, 'id' | 'created_at'>[]> {
  try {
    const pilotsMatchRegex = new RegExp(/(\s{4}pilotsById:)((.*\n)*)(\s{4}upgradesById:)/gm)
    const pilotsMatch = coffeeScriptText.match(pilotsMatchRegex);
    
    if (!pilotsMatch) {
      throw new Error('Could not find pilots section in CoffeeScript file');
    }

    const entries = pilotsMatch[0].trim().split('{').slice(1)

    
    const pilots: Omit<Pilot, 'id' | 'created_at'>[] = [];
    
    for (const pilotData of entries) {
      try {
        if (pilotData.match(/(skip:\s*true)|TransGalMeg/)) continue
        const pilot = parsePilotData(pilotData);
        pilots.push(pilot);
        console.log(`Parsed pilot: ${pilot.name}`);
      } catch (error) {
        console.error(`Error parsing pilot:`, error);
      }
    }
    
    return pilots; 
  } catch (error) {
    console.error('Error parsing CoffeeScript file for Pilots:', error);
    throw error;
  }
}



function parsePilotData(pilotData:string): Omit<Pilot, 'id' | 'created_at'> {
  const pilot: any = {
    name: "",
    maxPerSquad: 8
  }

  const nameMatch = pilotData.match(/name:\s*(?:"([^"]+)"|'([^']+)')/
);
  if (nameMatch) pilot.name = nameMatch[1] || nameMatch[2];
  
  const factionMatch = pilotData.match(/faction:\s*"([^"]+)"/);
  if (factionMatch) pilot.faction = factionMatch[1];

  const shipMatch = pilotData.match(/ship:\s*"([^"]+)"/);
  if (shipMatch) pilot.ship = shipMatch[1];

  const chassisMatch = pilotData.match(/chassis:\s*"([^"]+)"/);
  if (chassisMatch) pilot.chassis = chassisMatch[1];

  const xws_addonMatch = pilotData.match(/xws_addon:\s*"([^"]+)"/);
  if (xws_addonMatch) pilot.xws_addon = xws_addonMatch[1];

  const skillMatch = pilotData.match(/skill:\s*(\d+)/)
  if (skillMatch) {
    if (pilot.name.includes("Nashtah")) {
      // TODO: Figure out how to handle the Nashtah's `'*'` in the schema
      pilot.skill = skillMatch[1]
    } else {
      pilot.skill = parseInt(skillMatch[1])
    }
  }
  
  const forceMatch = pilotData.match(/force:\s*(\d+)/)
  if (forceMatch) pilot.force = parseInt(forceMatch[1])
  
  const chargeMatch = pilotData.match(/charge:\s*(\d+)/)
  if (chargeMatch) pilot.charge = parseInt(chargeMatch[1])
  
  const recurringMatch = pilotData.match(/recurring:\s*(\d+)/)
  if (recurringMatch) pilot.recurring = parseInt(recurringMatch[1])
  
  const pointsxwaMatch = pilotData.match(/pointsxwa:\s*(\d+)/)
  if (pointsxwaMatch) pilot.points = parseInt(pointsxwaMatch[1])
  if (!pilot.points) {
    const pointsMatch = pilotData.match(/points:\s*(\d+)/)
    if (pointsMatch) pilot.points = parseInt(pointsMatch[1])
  }
  
  const loadoutxwaMatch = pilotData.match(/loadoutxwa:\s*(\d+)/)
  if (loadoutxwaMatch) pilot.loadout = parseInt(loadoutxwaMatch[1])
  if (!pilot.loadout) {
    const loadoutMatch = pilotData.match(/loadout:\s*(\d+)/)
    if (loadoutMatch) pilot.loadout = parseInt(loadoutMatch[1])
  }

  const slotsxwaMatch = pilotData.match(/slotsxwa:\s*\[\s*([\s\S]*?)\s*\]/);
  if (slotsxwaMatch) {
    const slotsxwaContent = slotsxwaMatch[1];
    const slotsxwaMatches = slotsxwaContent.matchAll(/"([^"]+)"/g);
    pilot.slots = Array.from(slotsxwaMatches, match => match[1]);
  }
  if (!pilot.slots) {
    const slotsMatch = pilotData.match(/slots:\s*\[\s*([\s\S]*?)\s*\]/);
    if (slotsMatch) {
      const slotsContent = slotsMatch[1];
      const slotsMatches = slotsContent.matchAll(/"([^"]+)"/g);
      pilot.slots = Array.from(slotsMatches, match => match[1]);
    }
  }

  const upgradesMatch = pilotData.match(/upgrades:\s*\[\s*([\s\S]*?)\s*\]/);
  if (upgradesMatch) {
    const upgradesContent = upgradesMatch[1];
    const upgradesMatches = upgradesContent.matchAll(/"([^"]+)"/g);
    pilot.slots = Array.from(upgradesMatches, match => match[1]);
  }
  
  const keywordMatch = pilotData.match(/keyword:\s*\[\s*([\s\S]*?)\s*\]/);
  if (keywordMatch) {
    const keywordContent = keywordMatch[1];
    const keywordMatches = keywordContent.matchAll(/"([^"]+)"/g);
    pilot.slots = Array.from(keywordMatches, match => match[1]);
  }

  const maxPerSquadMatch = pilotData.match(/max_per_squad:\s*(\d)/);
  if (maxPerSquadMatch) pilot.maxPerSquad = parseInt(maxPerSquadMatch[1]);

  const uniqueMatch = pilotData.match(/unique:\s*true/);
  if (uniqueMatch) pilot.maxPerSquad = 1;

  // TODO: applies_condition, ship_override
  if (!pilot.name || !pilot.faction || !pilot.ship || !pilot.points || pilot.skill == null) {
    if (pilot.name.includes("Nashtah")) {
      return pilot
    }
    throw new Error(`Missing required fields for pilot: ${pilot.name}`)
  }

  return pilot
}