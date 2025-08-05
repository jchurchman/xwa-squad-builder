import { Faction, Platform } from '@shared/types';

type ImportedPlatform = {
  actions: string[];
  agility: number;
  attack?: number;
  attackb?: number;
  attackbull?: number;
  attackdt?: number;
  attackf?: number;
  attackl?: number;
  attackr?: number;
  attackt?: number;
  autoequip?: string[];
  base: string;
  chassis?: string;
  energy?: number;
  energyrecurr?: number;
  factions: Faction[];
  hull: number;
  icon?: string;
  keyword?: string[];
  maneuvers: number[][];
  name: string;
  shieldrecurr?: number;
  shields: number;
};

interface TransformedPlatform extends Omit<Platform, 'autoequip' | 'created_at' | 'id'> {
  autoequip?: string[];
}

export function transformPlatformsForDb(
  platforms: Record<string, ImportedPlatform>
): TransformedPlatform[] {
  return Object.values(platforms);
}
