import { store } from '../state';

export interface LoadingState {
  error: string | null;
  loading: boolean;
}

export type ShipId = string;

export interface ShipState {
  id: ShipId;
  pilotXws?: string;
  platformXws?: string;
  /** Upgrade XWS IDs by slot ID, e.g. { "crew-0": "chewbacca" }. */
  upgrades: Record<string, string>;
}

export interface ListState {
  shipOrder: ShipId[];
  ships: Record<ShipId, ShipState>;
}

export type RootState = ReturnType<typeof store.getState>;
export type GetState = () => RootState;
export type AppDispatch = typeof store.dispatch;
