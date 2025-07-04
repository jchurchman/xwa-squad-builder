import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../types';
import { HydratedUpgrade } from '@shared/types';

// Entity selectors
export const selectAllShips = (state: RootState) => Object.values(state.entities.ships);
export const selectAllPilots = (state: RootState) => Object.values(state.entities.pilots);
export const selectAllUpgrades = (state: RootState) => Object.values(state.entities.upgrades);

export const selectShipById = (state: RootState, shipId: number) => 
  state.entities.ships[shipId];

export const selectPilotById = (state: RootState, pilotId: number) => 
  state.entities.pilots[pilotId];

export const selectUpgradeById = (state: RootState, upgradeId: number) => 
  state.entities.upgrades[upgradeId];

// List selectors
export const selectList = (state: RootState) => state.list;
export const selectListShips = (state: RootState) => state.listShips;

// Faction-filtered selectors
export const selectPilotsByFaction = createSelector(
  [selectAllPilots, (state: RootState, faction: string) => faction],
  (pilots, faction) => pilots.filter(pilot => pilot.faction === faction)
);

export const selectShipsByFaction = createSelector(
  [selectAllShips, selectPilotsByFaction],
  (ships, pilots) => {
    const shipNames = new Set(pilots.map(pilot => pilot.ship));
    return ships.filter(ship => shipNames.has(ship.name));
  }
);

export const selectListPilots = createSelector(
  [selectList, selectListShips, (state: RootState) => state.entities.pilots],
  (list, listShips, pilots) => {
    if (!list) return [];
    
    return list.ships.map(shipId => {
      const listShip = listShips[shipId];
      return listShip ? pilots[listShip.pilotId] : null;
    }).filter(Boolean);
  }
);

export const selectListUpgrades = createSelector(
  [selectList, selectListShips, (state: RootState) => state.entities.upgrades],
  (list, listShips, upgrades) => {
    if (!list) return [];
    
    const allUpgrades: HydratedUpgrade[] = [];
    
    list.ships.forEach(shipId => {
      const listShip = listShips[shipId];
      if (!listShip) return;
      
      Object.values(listShip.upgrades).forEach(upgradeIds => {
        upgradeIds.forEach(upgradeId => {
          const upgrade = upgrades[upgradeId];
          if (upgrade) allUpgrades.push(upgrade);
        });
      });
    });
    
    return allUpgrades;
  }
);

// Utility selectors for restrictions
export const selectHasPilot = createSelector(
  [selectListPilots, (state: RootState, pilotName: string) => pilotName],
  (pilots, pilotName) => pilots.some(pilot => pilot?.name === pilotName)
);

export const selectHasUpgrade = createSelector(
  [selectListUpgrades, (state: RootState, upgradeName: string) => upgradeName],
  (upgrades, upgradeName) => upgrades.some(upgrade => upgrade.name === upgradeName)
);

// Calculate total points
export const selectListPoints = createSelector(
  [selectListPilots, selectListUpgrades],
  (pilots, upgrades) => {
    const pilotPoints = pilots.reduce((sum, pilot) => sum + (pilot?.points || 0), 0);
    const upgradePoints = upgrades.reduce((sum, upgrade) => sum + (upgrade.points || 0), 0);
    return pilotPoints + upgradePoints;
  }
);

// Validation selectors
export const selectListIsValid = createSelector(
  [selectList, selectListPoints],
  (list, points) => {
    if (!list) return false;
    
    return (
      list.ships.length >= 3 &&
      list.ships.length <= 8 &&
      points <= 200 // Standard game limit
    );
  }
);

export const selectSelectedShip = (state: RootState) => 
  state.ui.selectedShipId ? state.listShips[state.ui.selectedShipId] : null;

export const selectUILoading = (state: RootState) => state.ui.loading;
export const selectUIError = (state: RootState) => state.ui.error;