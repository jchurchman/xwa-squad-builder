import {
  HydratedPilot,
  HydratedShip,
  HydratedUpgrade,
  PilotId,
  ShipId,
  UpgradeId,
} from '@shared/types';

export interface LoadingState {
  error: string | null;
  loading: boolean;
}

export interface EntitiesState {
  pilots: { [id: number]: HydratedPilot };
  pilotsByShip: { [shipName: string]: number[] };
  ships: { [id: number]: HydratedShip };
  shipsByFaction: { [faction: string]: number[] };
  upgrades: { [id: number]: HydratedUpgrade };
}

export type ConstructedShipId = string;

export type SelectedUpgrades = Record<string, (UpgradeId | null)[]>;

export interface ConstructedShipState {
  id: ConstructedShipId;
  pilot?: PilotId;
  ship?: ShipId;
  upgrades?: SelectedUpgrades;
}

export interface ListState {
  constructedShipOrder: ConstructedShipId[];
  ships: Record<ConstructedShipId, ConstructedShipState>;
}
