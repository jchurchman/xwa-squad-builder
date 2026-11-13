import type { Faction } from '@/types/faction';

/** Faction IDs. URL-safe, and also the faction's CSS class and icon name. */
export const FACTION = {
  EMPIRE: 'galactic-empire',
  FIRST_ORDER: 'first-order',
  REBELS: 'rebel-alliance',
  REPUBLIC: 'galactic-republic',
  RESISTANCE: 'resistance',
  SCUM: 'scum-and-villainy',
  SEPARATISTS: 'separatist-alliance',
} as const;

// Maps faction IDs to the XWS faction IDs the backend expects.
export const FACTION_XWS: Record<Faction, string> = Object.freeze({
  [FACTION.EMPIRE]: 'galacticempire',
  [FACTION.FIRST_ORDER]: 'firstorder',
  [FACTION.REBELS]: 'rebelalliance',
  [FACTION.REPUBLIC]: 'galacticrepublic',
  [FACTION.RESISTANCE]: 'resistance',
  [FACTION.SCUM]: 'scumandvillainy',
  [FACTION.SEPARATISTS]: 'separatistalliance',
});

// TODO: Slot enum type
// Display order for upgrade slots, using the slot names from the card data. Borrowed from YASB;
// slot types YASB did not have are at the end.
export const SLOT_ORDER = Object.freeze([
  'Talent',
  'Force Power',
  'Tactical Relay',
  'Turret',
  'Tech',
  'Sensor',
  'Cannon',
  'Torpedo',
  'Missile',
  'Crew',
  'Gunner',
  'Astromech',
  'Device',
  'Illicit',
  'Modification',
  'Configuration',
  'Title',
  'Command',
  'Hardpoint',
  'Cargo',
  'Team',
  'Hyperdrive',
]);
