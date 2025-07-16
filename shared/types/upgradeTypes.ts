import { Restrictions, ShipOverride } from './common';

export type UpgradeId = number;

export interface HydratedUpgrade
  extends Omit<UpgradeRow, 'appliesCondition' | 'keywords' | 'ship' | 'shipOverride'> {
  appliesCondition?: string[];
  keywords?: string[];
  ship?: string[];
  shipOverride: ShipOverride;
  upgradeRestrictions: Restrictions;
}

export interface Upgrade {
  appliesCondition?: string[];
  charge?: number;
  chassis?: string;
  force?: number;
  forcerecurring?: number;
  keywords?: string[];
  maxPerSquad?: number;
  name: string;
  points?: number;
  recurring?: number;
  ship?: string[];
  shipOverride: ShipOverride;
  upgradeRestrictions: Restrictions;
  xws?: string;
  xwsaddon?: string;
}

export interface UpgradeRestrictionRow {
  id: number;
  operator: string;
  restriction_type: string;
  restriction_values: string; // JSON string
  upgrade_id: number;
}

export interface UpgradeRow {
  appliesCondition?: string; // JSON string
  charge?: number;
  chassis?: string;
  created_at: string;
  force?: number;
  forcerecurring?: number;
  id: UpgradeId;
  keywords?: string; // JSON string
  maxPerSquad?: number;
  name: string;
  points?: number;
  recurring?: number;
  ship?: string; // JSON string
  shipOverride: string; // JSON string
  xws?: string;
  xwsaddon?: string;
}
