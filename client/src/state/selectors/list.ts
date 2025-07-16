import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '..';

export const selectConstructedShipOrderList = (state: RootState) => state.list.constructedShipOrder;
export const selectConstructedShips = (state: RootState) => state.list.ships;

export const selectList = createSelector(
  [selectConstructedShipOrderList, selectConstructedShips],
  (constructedShipOrderArr, constructedShips) => {
    return constructedShipOrderArr.map((id) => constructedShips[id]);
  }
);
