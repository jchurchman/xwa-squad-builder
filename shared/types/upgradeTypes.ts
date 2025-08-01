import { PlatformOverride, Restrictions } from './common';

export type UpgradeId = number;

export type SlotType = string;

export interface HydratedUpgrade
  extends Omit<UpgradeRow, 'appliesCondition' | 'keywords' | 'platform' | 'platformOverride'> {
  appliesCondition?: string[];
  keywords?: string[];
  platform?: string[];
  platformOverride: PlatformOverride;
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
  platform?: string[];
  platformOverride: PlatformOverride;
  points?: number;
  recurring?: number;
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
  platform?: string; // JSON string
  platformOverride: string; // JSON string
  points?: number;
  recurring?: number;
  xws?: string;
  xwsaddon?: string;
}
