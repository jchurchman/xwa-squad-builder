import type { RootState, ShipId } from '@types';

export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

export const selectShipById = (state: RootState, shipId: ShipId) => state.list.ships[shipId];
