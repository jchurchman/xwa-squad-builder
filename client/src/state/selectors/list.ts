import type { RootState, ShipId } from '@types';

export const selectList = (state: RootState) => state.list;

export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

export const selectShipById = (state: RootState, shipId: ShipId) => state.list.ships[shipId];
