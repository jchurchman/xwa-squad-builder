import { store } from '../state';

import {
  HydratedPilot,
  HydratedPlatform,
  HydratedUpgrade,
  PilotId,
  PlatformId,
  UpgradeId,
} from '@shared/types';

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

export type SlotId = string; // e.g., "talent-0", "cannon-1"

export type ShipId = string;

export type SelectedUpgrades = Record<SlotId, UpgradeId | null>;

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
