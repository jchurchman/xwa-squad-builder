import { FACTION } from '@/constants';

import type { Faction } from '@/types/faction';

const FACTIONS = new Set<string>(Object.values(FACTION));

/** Whether a route parameter names one of the game's factions. */
export function isFaction(value: string | undefined): value is Faction {
  return value !== undefined && FACTIONS.has(value);
}
