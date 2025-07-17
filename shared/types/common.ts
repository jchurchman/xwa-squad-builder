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
  platform?: string[];
  slotEquipped?: string[];
  slots?: string[];
  solitary?: boolean;
  upgradesInList?: string[];
};

export type PlatformOverride = {
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
};
