
export interface HydratedShip
  extends Omit<ShipRow, 'actions' | 'autoequip' | 'factions' | 'keyword' | 'maneuvers'> {
  actions: string[];
  autoequip?: string[];
  factions: string[];
  keyword?: string[];
  maneuvers: number[][];
}

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