import { Restrictions, ShipOverride } from './common';

export type PilotId = number;

export interface HydratedPilot
  extends Omit<
    PilotRow,
    'appliesCondition' | 'keywords' | 'shipOverride' | 'slots' | 'upgrades' | 'xwsship'
  > {
  appliesCondition?: string[];
  keywords?: string[];
  restrictions?: Restrictions;
  shipOverride?: ShipOverride;
  slots: string[];
  upgrades?: string[];
  xwsship?: boolean;
}

export interface Pilot {
  appliesCondition?: string[];
  charge?: number;
  chassis?: string;
  engagement?: number;
  faction: string;
  force?: number;
  forcerecurring?: number;
  keywords?: string[];
  loadout: number;
  maxPerSquad?: number;
  name: string;
  points: number;
  recurring?: number;
  restrictions?: Restrictions;
  ship: string;
  shipOverride?: ShipOverride;
  skill: number;
  slots: string[];
  upgrades?: string[];
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
  points: number;
  recurring?: number;
  ship: string;
  shipOverride?: string; // JSON string
  skill: number;
  slots: string; // JSON string
  upgrades?: string; // JSON string
  xws?: string;
  xwsaddon?: string;
  xwsship?: number; // 0 or 1
}
