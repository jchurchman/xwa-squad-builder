import {
  HydratedPilot,
  HydratedPlatform,
  HydratedUpgrade,
  PilotId,
  PlatformId,
  UpgradeId,
} from '@shared/types';

import { store } from '../state';

export interface LoadingState {
  error: string | null;
  loading: boolean;
}

export interface EntitiesState {
  pilots: { [id: number]: HydratedPilot };
  pilotsByPlatform: { [platformName: string]: number[] };
  platforms: { [id: number]: HydratedPlatform };
  platformsByFaction: { [faction: string]: number[] };
  upgrades: { [id: number]: HydratedUpgrade };
}

export type ShipId = string;

export type SelectedUpgrades = Record<string, (UpgradeId | null)[]>;

export interface ShipState {
  id: ShipId;
  pilot?: PilotId;
  platform?: PlatformId;
  upgrades?: SelectedUpgrades;
}

export interface ListState {
  shipOrder: ShipId[];
  ships: Record<ShipId, ShipState>;
}

export type RootState = ReturnType<typeof store.getState>;
export type GetState = () => RootState;
export type AppDispatch = typeof store.dispatch;
