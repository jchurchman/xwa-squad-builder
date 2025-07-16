import { createSelector } from '@reduxjs/toolkit';
import { HydratedUpgrade } from '@shared/types';

import { RootState } from '.';
import { Faction } from 'src/types';

export const selectAllShips = (state: RootState) => Object.values(state.entities.ships);
export const selectAllShipsMap = (state: RootState) => state.entities.ships;
export const selectAllPilots = (state: RootState) => Object.values(state.entities.pilots);
export const selectAllUpgrades = (state: RootState) => Object.values(state.entities.upgrades);

export const selectShipById = (state: RootState, shipId: number) => state.entities.ships[shipId];

export const selectPilotById = (state: RootState, pilotId: number) =>
  state.entities.pilots[pilotId];

export const selectUpgradeById = (state: RootState, upgradeId: number) =>
  state.entities.upgrades[upgradeId];

export const selectList = (state: RootState) => state.list;
export const selectListShips = (state: RootState) => state.list.ships;
export const selectOrderedListShipIds = (state: RootState) => state.list.constructedShipOrder;

export const selectPilotsByFaction = createSelector(
  [selectAllPilots, (_: RootState, faction: string) => faction],
  (pilots, faction) => pilots.filter((pilot) => pilot.faction === faction)
);

export const selectShipsByFaction = createSelector(
  [
    selectAllShipsMap,
    (state: RootState) => state.entities.shipsByFaction,
    (_: RootState, faction: Faction) => faction
  ],
  (ships, shipsByFactionMap, faction) => {
    const shipIdsInFaction = shipsByFactionMap[faction] || []
    return shipIdsInFaction.map(id => ships[id]);
  }
);

export const selectListPilots = createSelector(
  [selectOrderedListShipIds, selectListShips, (state: RootState) => state.entities.pilots],
  (shipIds, listShips, pilots) => {
    if (!shipIds || shipIds.length === 0) return [];

    return shipIds
      .map((shipId) => {
        const listShip = listShips[shipId];
        return listShip && listShip.pilot ? pilots[listShip.pilot] : null;
      })
      .filter(Boolean);
  }
);

export const selectConstructedShipChassis = createSelector(
  [
    selectAllShipsMap,
    selectListShips,
    (_:RootState, constructedShipId: string) => constructedShipId
  ],
  (allShips, listShips, constructedShipId) => {
    console.log({ allShips, listShips, constructedShipId })
    const { ship } = listShips[constructedShipId]

    if (ship) {
      return allShips[ship]
    }

    return undefined
  }
)

export const selectListUpgrades = createSelector(
  [selectOrderedListShipIds, selectListShips, (state: RootState) => state.entities.upgrades],
  (shipIds, listShips, upgrades) => {
    if (!shipIds || shipIds.length === 0) return [];

    const allUpgrades: HydratedUpgrade[] = [];

    shipIds.forEach((shipId) => {
      const listShip = listShips[shipId];
      if (!listShip) return;

      Object.values(listShip.upgrades || {}).forEach((upgradeIds) => {
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

export const selectListIsValid = createSelector([selectList, selectListPoints], (list, points) => {
  if (!list) return false;

  return (
    list.constructedShipOrder.length >= 3 && list.constructedShipOrder.length <= 8 && points <= 50 // Standard game limit
  );
});
