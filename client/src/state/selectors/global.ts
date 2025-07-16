import { createSelector } from '@reduxjs/toolkit';

import { selectPilotsLoading, selectShipsLoading, selectUpgradesLoading } from './entities';

export const selectGlobalLoading = createSelector(
  [selectShipsLoading, selectPilotsLoading, selectUpgradesLoading],
  (shipsLoading, pilotsLoading, upgradesLoading) => {
    return shipsLoading.loading || pilotsLoading.loading || upgradesLoading.loading;
  }
);

// Global error selector
export const selectGlobalError = createSelector(
  [selectShipsLoading, selectPilotsLoading, selectUpgradesLoading],
  (shipsLoading, pilotsLoading, upgradesLoading) => {
    return shipsLoading.error || pilotsLoading.error || upgradesLoading.error;
  }
);
