import { HydratedPilot, HydratedShip, HydratedUpgrade } from "@shared/types";

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface EntitiesState {
  ships: { [id: number]: HydratedShip };
  pilots: { [id: number]: HydratedPilot };
  upgrades: { [id: number]: HydratedUpgrade };
  shipsByFaction: { [faction: string]: number[] };
  pilotsByShip: { [shipName: string]: number[] };
  shipsLoading: LoadingState;
  pilotsLoading: LoadingState;
  upgradesLoading: LoadingState;
}