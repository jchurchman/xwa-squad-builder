import { Faction, PlatformOverride, Restrictions } from './common';

export type PilotId = number;

export interface HydratedPilot
  extends Omit<
    PilotRow,
    'appliesCondition' | 'keywords' | 'platformOverride' | 'slots' | 'upgrades' | 'xwsship'
  > {
  appliesCondition?: string[];
  keywords?: string[];
  platformOverride?: PlatformOverride;
  restrictions?: Restrictions;
  slots: string[];
  upgrades?: number[];
  xwsship?: boolean;
}

export interface Pilot {
  appliesCondition?: string[];
  charge?: number;
  chassis?: string;
  engagement?: number;
  faction: Faction;
  force?: number;
  forcerecurring?: number;
  keywords?: string[];
  loadout: number;
  maxPerSquad?: number;
  name: string;
  platform: string;
  platformOverride?: PlatformOverride;
  points: number;
  recurring?: number;
  restrictions?: Restrictions;
  skill: number;
  slots: string[];
  upgrades?: number[];
  xws?: string;
  xwsaddon?: string;
  xwsship?: boolean;
}

export interface PilotRestrictionRow {
  id: number;
  operator: string;
  pilot_id: number;
  restriction_type: string;
  restriction_values: string; // JSON string
}

export interface PilotRow {
  appliesCondition?: string; // JSON string
  charge?: number;
  chassis?: string;
  created_at: string;
  engagement?: number;
  faction: string;
  force?: number;
  forcerecurring?: number;
  id: PilotId;
  keywords?: string; // JSON string
  loadout: number;
  maxPerSquad?: number;
  name: string;
  platform: string;
  platformOverride?: string; // JSON string
  points: number;
  recurring?: number;
  skill: number;
  slots: string; // JSON string
  upgrades?: string; // JSON string
  xws?: string;
  xwsaddon?: string;
  xwsship?: number; // 0 or 1
}
