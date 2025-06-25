import { Ship } from '../types';

type importedShip = {
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
};

export function transformShipsForDb(ships: Record<string, importedShip>): Ship[] {
  return Object.values(ships);
}
