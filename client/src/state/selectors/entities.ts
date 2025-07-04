import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../.';

export const selectShips = (state: RootState) => state.entities.ships;
export const selectPilots = (state: RootState) => state.entities.pilots;
export const selectUpgrades = (state: RootState) => state.entities.upgrades;

export const selectAllShips = createSelector(
  [selectShips],
  (ships) => Object.values(ships)
);

export const selectAllPilots = createSelector(
  [selectPilots],
  (pilots) => Object.values(pilots)
);

export const selectAllUpgrades = createSelector(
  [selectUpgrades],
  (upgrades) => Object.values(upgrades)
);

export const selectShipById = (state: RootState, shipId: number) => 
  state.entities.ships[shipId];

export const selectPilotById = (state: RootState, pilotId: number) => 
  state.entities.pilots[pilotId];

export const selectUpgradeById = (state: RootState, upgradeId: number) => 
  state.entities.upgrades[upgradeId];

// Indexed collection selectors - these are now O(1) lookups!
export const selectShipsByFaction = (state: RootState, faction: string) => 
  (state.entities.shipsByFaction[faction] || []).map(id => state.entities.ships[id]);

export const selectPilotsByShip = (state: RootState, shipName: string) => 
  (state.entities.pilotsByShip[shipName] || []).map(id => state.entities.pilots[id]);

export const selectShipsLoading = (state: RootState) => state.entities.shipsLoading;
export const selectPilotsLoading = (state: RootState) => state.entities.pilotsLoading;
export const selectUpgradesLoading = (state: RootState) => state.entities.upgradesLoading;