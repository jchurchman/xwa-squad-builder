import { Faction } from '@shared/types';

const FACTIONS = new Set<string>(Object.values(Faction));

/** Whether a route parameter names one of the game's factions. */
export function isFaction(value: string | undefined): value is Faction {
  return value !== undefined && FACTIONS.has(value);
}
