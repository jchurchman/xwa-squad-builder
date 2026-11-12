import { Faction } from '@shared/types';

// Maps the faction names used in routes to the XWS faction IDs the backend expects.
export const FACTION_XWS: Record<Faction, string> = Object.freeze({
  [Faction.empire]: 'galacticempire',
  [Faction.firstorder]: 'firstorder',
  [Faction.rebels]: 'rebelalliance',
  [Faction.republic]: 'galacticrepublic',
  [Faction.resistance]: 'resistance',
  [Faction.scum]: 'scumandvillainy',
  [Faction.separatists]: 'separatistalliance',
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
