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

// TODO: Take the points source from a query parameter, defaulting to the latest XWA version, once
// XWA points are imported. Only AMG has a published points version so far.
export const POINTS_SOURCE = 'amg';

/** List formats. URL-safe, and the format names points versions use (docs/architecture.md, D4). */
export const FORMAT = {
  EPIC: 'epic',
  EXTENDED: 'extended',
  STANDARD: 'standard',
} as const;

export const DEFAULT_FORMAT = FORMAT.STANDARD;

// The formats AMG points offer, in display order. XWA has only Standard and Epic; switch this
// along with POINTS_SOURCE.
export const FORMAT_ORDER = Object.freeze([FORMAT.STANDARD, FORMAT.EXTENDED, FORMAT.EPIC]);

// The query parameter that holds the list's format, e.g. "?format=extended".
export const FORMAT_PARAM = 'format';

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
  'Weapon Hardpoint',
  'Versatile Frame',
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

// Slots that take more than one upgrade type: XWA gives some ships one of these in place of a fixed
// weapon slot (YASB calls them HardpointShip and VersatileShip). Every other slot takes only
// upgrades of its own type.
export const MULTI_TYPE_SLOTS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'Versatile Frame': ['Torpedo', 'Missile'],
  'Weapon Hardpoint': ['Cannon', 'Torpedo', 'Missile'],
});
