import { createSelector } from '@reduxjs/toolkit';

import {
  selectAllPilotsMap,
  selectAllPlatformsMap,
  selectAllUpgradesMap,
  selectPilotIdsByPlatformMap,
} from './entities';

import { Faction, HydratedPilot, HydratedUpgrade } from '@shared/types';
import { RootState } from '@types';

type ListSelectorArgs = {
  faction?: Faction;
  shipId?: string;
};

function listSelectorArgsForwarder(_: RootState, args: ListSelectorArgs) {
  return args;
}

export const selectListState = (state: RootState) => state.list;
export const selectListShips = (state: RootState) => state.list.ships;
export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

export const selectListPilots = createSelector(
  [selectShipOrderIds, selectListShips, selectAllPilotsMap],
  (shipIds, listShips, pilots) => {
    if (!shipIds || shipIds.length === 0) return [];

    return shipIds
      .map((platformId) => {
        const listPlatform = listShips[platformId];
        return listPlatform && listPlatform.pilot ? pilots[listPlatform.pilot] : null;
      })
      .filter(Boolean);
  }
);

export const selectList = createSelector(
  [selectShipOrderIds, selectListShips],
  (shipOrder, ships) => {
    return shipOrder.map((id) => ships[id]);
  }
);

export const selectShipPlatform = createSelector(
  [selectAllPlatformsMap, selectListShips, listSelectorArgsForwarder],
  (allPlatforms, listPlatforms, { shipId }) => {
    if (!shipId) {
      return undefined;
    }
    const { platform } = listPlatforms[shipId] || {};

    if (platform) {
      return allPlatforms[platform];
    }

    return undefined;
  }
);

function createEmptyPilotsArr(): HydratedPilot[] {
  return [] as HydratedPilot[];
}

const emptyPilotsArr: HydratedPilot[] = createEmptyPilotsArr();

export const selectPilotsByPlatformAndFaction = createSelector(
  [selectPilotIdsByPlatformMap, selectAllPilotsMap, selectShipPlatform, listSelectorArgsForwarder],
  (pilotIdsByPlatformMap, allPilotsMap, selectedPlatform, { faction }) => {
    if (!selectedPlatform) {
      return emptyPilotsArr;
    }

    const pilotIdsByPlatform = pilotIdsByPlatformMap[selectedPlatform?.name || ''];

    if (!pilotIdsByPlatform) {
      return emptyPilotsArr;
    }

    const platformPilotsByFaction = pilotIdsByPlatform.reduce((accum, id) => {
      const pilot = allPilotsMap[`${id}`];
      if (pilot.faction == faction) {
        accum.push(pilot);
      }
      return accum;
    }, createEmptyPilotsArr());

    return platformPilotsByFaction;
  }
);

export const selectShipPilot = createSelector(
  [selectAllPilotsMap, selectListShips, listSelectorArgsForwarder],
  (allPilots, listShips, { shipId }) => {
    if (!shipId) {
      return undefined;
    }
    const { pilot } = listShips[shipId];
    if (pilot) {
      return allPilots[pilot];
    }
    return undefined;
  }
);

export const selectListUpgrades = createSelector(
  [selectShipOrderIds, selectListShips, selectAllUpgradesMap],
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
