import { FACTION } from '@/constants';

import type { Faction } from '@/types/faction';

/** Faction names as players read them. */
export const FACTION_NAMES: Record<Faction, string> = {
  [FACTION.EMPIRE]: 'Galactic Empire',
  [FACTION.FIRST_ORDER]: 'First Order',
  [FACTION.REBELS]: 'Rebel Alliance',
  [FACTION.REPUBLIC]: 'Galactic Republic',
  [FACTION.RESISTANCE]: 'Resistance',
  [FACTION.SCUM]: 'Scum and Villainy',
  [FACTION.SEPARATISTS]: 'Separatist Alliance',
};
