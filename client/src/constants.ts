import type { ValueOf } from '@/types/utility';

/** Faction display names, used in routes. */
export const FACTION = {
  EMPIRE: 'Galactic Empire',
  FIRST_ORDER: 'First Order',
  REBELS: 'Rebel Alliance',
  REPUBLIC: 'Galactic Republic',
  RESISTANCE: 'Resistance',
  SCUM: 'Scum and Villainy',
  SEPARATISTS: 'Separatist Alliance',
} as const;

export type Faction = ValueOf<typeof FACTION>;

// Maps the faction names used in routes to the XWS faction IDs the backend expects.
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
