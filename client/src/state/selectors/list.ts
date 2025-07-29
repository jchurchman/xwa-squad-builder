import { createSelector } from '@reduxjs/toolkit';

import { selectAllPilotsMap, selectAllPlatformsMap, selectPilotIdsByPlatformMap } from './entities';

import { HydratedUpgrade } from '@shared/types';
import { RootState } from '@types';

export const selectListState = (state: RootState) => state.list;
export const selectListPlatforms = (state: RootState) => state.list.ships;
export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

export const selectListPilots = createSelector(
  [selectShipOrderIds, selectListPlatforms, (state: RootState) => state.entities.pilots],
  (platformIds, listPlatforms, pilots) => {
    if (!platformIds || platformIds.length === 0) return [];

    return platformIds
      .map((platformId) => {
        const listPlatform = listPlatforms[platformId];
        return listPlatform && listPlatform.pilot ? pilots[listPlatform.pilot] : null;
      })
      .filter(Boolean);
  }
);

export const selectList = createSelector(
  [selectShipOrderIds, selectListPlatforms],
  (shipOrder, ships) => {
    return shipOrder.map((id) => ships[id]);
  }
);

export const selectShipPlatform = createSelector(
  [
    selectAllPlatformsMap,
    selectListPlatforms,
    (_: RootState, constructedPlatformId: string) => constructedPlatformId,
  ],
  (allPlatforms, listPlatforms, constructedPlatformId) => {
    const { platform } = listPlatforms[constructedPlatformId] || {};

    if (platform) {
      return allPlatforms[platform];
    }

    return undefined;
  }
);

export const selectPilotsByPlatform = createSelector(
  [selectPilotIdsByPlatformMap, selectAllPilotsMap, selectShipPlatform],
  (pilotIdsByPlatformMap, allPilotsMap, selectedPlatform) => {
    const relevantPilotIds = pilotIdsByPlatformMap[selectedPlatform?.name || ''] || [];

    console.log({ allPilotsMap, pilotIdsByPlatformMap, relevantPilotIds });

    return relevantPilotIds.map((id) => allPilotsMap[`${id}`]).filter(Boolean);
  }
);

export const selectShipPilot = createSelector(
  [
    selectAllPilotsMap,
    selectListPlatforms,
    (_: RootState, constructedPlatformId: string) => constructedPlatformId,
  ],
  (allPilots, listPlatforms, constructedPlatformId) => {
    const { pilot } = listPlatforms[constructedPlatformId];
    if (pilot) {
      return allPilots[pilot];
    }
    return undefined;
  }
);

export const selectListUpgrades = createSelector(
  [selectShipOrderIds, selectListPlatforms, (state: RootState) => state.entities.upgrades],
  (platformIds, listPlatforms, upgrades) => {
    if (!platformIds || platformIds.length === 0) return [];

    const allUpgrades: HydratedUpgrade[] = [];

    platformIds.forEach((platformId) => {
      const listPlatform = listPlatforms[platformId];
      if (!listPlatform) return;

      Object.values(listPlatform.upgrades || {}).forEach((upgradeIds) => {
        upgradeIds.forEach((upgradeId) => {
          if (!upgradeId) return;
          const upgrade = upgrades[upgradeId];
          if (upgrade) allUpgrades.push(upgrade);
        });
      });
    });

    return allUpgrades;
  }
);

export const selectHasPilot = createSelector(
  [selectListPilots, (_: RootState, pilotName: string) => pilotName],
  (pilots, pilotName) => pilots.some((pilot) => pilot?.name === pilotName)
);

export const selectHasUpgrade = createSelector(
  [selectListUpgrades, (_: RootState, upgradeName: string) => upgradeName],
  (upgrades, upgradeName) => upgrades.some((upgrade) => upgrade.name === upgradeName)
);

export const selectListPoints = createSelector(
  [selectListPilots, selectListUpgrades],
  (pilots, upgrades) => {
    const pilotPoints = pilots.reduce((sum, pilot) => sum + (pilot?.points || 0), 0);
    const upgradePoints = upgrades.reduce((sum, upgrade) => sum + (upgrade.points || 0), 0);
    return pilotPoints + upgradePoints;
  }
);

export const selectListIsValid = createSelector(
  [selectListState, selectListPoints],
  (list, points) => {
    if (!list) return false;

    return (
      list.shipOrder.length >= 3 && list.shipOrder.length <= 8 && points <= 50 // Standard game limit
    );
  }
);
