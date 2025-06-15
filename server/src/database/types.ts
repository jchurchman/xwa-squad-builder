export interface Ship {
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
  factions: string[];
  hull: number;
  icon?: string;
  keyword?: string[];
  maneuvers: number[][];
  name: string;
  shieldrecurr?: number;
  shields: number;
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

export type ShipOverride = {
  actions?: string[];
  addSlots?: string[];
  agility?: number;
  attack?: number;
  attackb?: number;        
  attackbull?: number;   
  attackdt?: number;
  attackf?: number;      
  attackt?: number;
  energy?: number;
  force?: number;
  hull?: number;
  maneuvers?: number[][];
  range?: [number, number];
  rangebonus?: boolean;  
  removeSlots?: string[];
  shields?: number;
}

export type Restrictions = {
  action?: string[];
  agility?: number;
  attackArc?: string;
  base?: string[];
  chassis?: string;
  faction?: string[];
  factionOrUnique?: {
    faction: string;
    uniqueName: string;
  };
  keyword?: string[];
  maxPerSquad?: number;
  maxSkill?: number;
  minEnergy?: number;
  minShield?: number;
  minSkill?: number;
  ship?: string[];
  slotEquipped?: string[];
  slots?: string[];
  solitary?: boolean;
  upgradesInList?: string[];
}

export interface ShipRow {
  actions: string; // JSON string
  agility: number;
  attack?: number;
  attackb?: number;
  attackbull?: number;
  attackdt?: number;
  attackf?: number;
  attackl?: number;
  attackr?: number;
  attackt?: number;
  autoequip?: string; // JSON string
  base: string;
  chassis?: string;
  created_at: string;
  energy?: number;
  energyrecurr?: number;
  factions: string; // JSON string
  hull: number;
  icon?: string;
  id: number;
  keyword?: string; // JSON string
  maneuvers: string; // JSON string
  name: string;
  shieldrecurr?: number;
  shields: number;
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
  id: number;
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

export interface UpgradeRow {
  appliesCondition?: string; // JSON string
  charge?: number;
  chassis?: string;
  created_at: string;
  force?: number;
  forcerecurring?: number;
  id: number;
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

export interface PilotRestrictionRow {
  id: number;
  operator: string;
  pilot_id: number;
  restriction_type: string;
  values: string; // JSON string
}

export interface UpgradeRestrictionRow {
  id: number;
  operator: string;
  restriction_type: string;
  upgrade_id: number;
  values: string; // JSON string
}

export interface HydratedShip extends Omit<ShipRow, 'actions' | 'factions' | 'maneuvers' | 'autoequip' | 'keyword'> {
  actions: string[];
  autoequip?: string[];
  factions: string[];
  keyword?: string[];
  maneuvers: number[][];
}

export interface HydratedPilot extends Omit<PilotRow, 'slots' | 'appliesCondition' | 'keywords' | 'shipOverride' | 'upgrades' | 'xwsship'> {
  appliesCondition?: string[];
  keywords?: string[];
  restrictions?: Restrictions;
  shipOverride?: ShipOverride;
  slots: string[];
  upgrades?: string[];
  xwsship?: boolean;
}

export interface HydratedUpgrade extends Omit<UpgradeRow, 'shipOverride' | 'appliesCondition' | 'keywords' | 'ship'> {
  appliesCondition?: string[];
  keywords?: string[];
  ship?: string[];
  shipOverride: ShipOverride;
  upgradeRestrictions: Restrictions;
}