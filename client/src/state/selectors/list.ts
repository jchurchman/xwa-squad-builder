import { createSelector } from '@reduxjs/toolkit';

import { SLOT_ORDER } from 'src/constants';

import {
  selectAllPilotsMap,
  selectAllPlatformsMap,
  selectAllUpgradesMap,
  selectPilotIdsByPlatformMap,
  selectUpgradeIdsBySlot,
} from './entities';

import { Faction, HydratedPilot, HydratedPlatform, HydratedUpgrade } from '@shared/types';
import { RootState, SlotId } from '@types';

type ListSelectorArgs = {
  faction?: Faction;
  shipId?: string;
  slotId?: SlotId;
  slotType?: string;
};

function listSelectorArgsForwarder(_: RootState, args: ListSelectorArgs) {
  return args;
}

export const selectListState = (state: RootState) => state.list;
export const selectListShips = (state: RootState) => state.list.ships;
export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

export const selectSpecificShip = createSelector(
  [selectListShips, listSelectorArgsForwarder],
  (listShips, { shipId }) => {
    // console.log('selectSpecificShip recomputing');
    return listShips[shipId!];
  }
);

export const selectListPilots = createSelector(
  [selectShipOrderIds, selectListShips, selectAllPilotsMap],
  (shipIds, listShips, pilots) => {
    // console.log('selectListPilots recomputing');
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
    // console.log('selectList recomputing');
    return shipOrder.map((id) => ships[id]);
  }
);

export const selectShipPlatform = createSelector(
  [selectAllPlatformsMap, selectSpecificShip],
  (allPlatforms, ship) => {
    // console.log('selectShipPlatform recomputing');
    const { platform } = ship || {};

    return platform ? allPlatforms[platform] : undefined;
  }
);

function createEmptyPilotsArr(): HydratedPilot[] {
  return [] as HydratedPilot[];
}

const emptyPilotsArr: HydratedPilot[] = createEmptyPilotsArr();

export const selectPilotsByPlatformAndFaction = createSelector(
  [selectPilotIdsByPlatformMap, selectAllPilotsMap, selectShipPlatform, listSelectorArgsForwarder],
  (pilotIdsByPlatformMap, allPilotsMap, selectedPlatform, { faction }) => {
    // console.log('selectPilotsByPlatformAndFaction recomputing');
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
  [selectAllPilotsMap, selectSpecificShip],
  (allPilots, ship) => {
    // console.log('selectShipPilot recomputing');
    const { pilot } = ship || {};

    return pilot ? allPilots[pilot] : undefined;
  }
);

export const selectShipUpgrades = createSelector(
  [selectAllUpgradesMap, selectSpecificShip],
  (allUpgrades, ship) => {
    // console.log('selectShipUpgrades recomputing');
    const { upgrades } = ship;

    return Object.entries(upgrades).reduce(
      (accum, [key, value]) => {
        if (value) {
          accum[key] = allUpgrades[value];
        }
        return accum;
      },
      {} as Record<SlotId, HydratedUpgrade | null>
    );
  }
);

const SLOT_ID_DELIMITER = '-';

export const selectShipUpgradeSlots = createSelector(
  [selectShipPilot, selectShipUpgrades],
  (pilot, upgrades) => {
    // console.log('selectShipUpgradeSlots recomputing');
    if (!pilot) {
      return [];
    }

    const slotCounts: Record<string, number> = {};
    const slotIds: [SlotId, string][] = [];

    pilot?.slots.forEach((slotType) => {
      slotCounts[slotType] = (slotCounts[slotType] || 0) + 1;
    });

    // TODO: figure out how to apply upgrade ship overrides to slotCounts
    console.log('shipUpgrades ', upgrades);

    SLOT_ORDER.forEach((slotType) => {
      const count = slotCounts[slotType] || 0;
      for (let i = 0; i < count; i++) {
        slotIds.push([`${slotType.toLowerCase()}${SLOT_ID_DELIMITER}${i}`, slotType]);
      }
    });

    return slotIds;
  }
);

// TODO: Make this prettier
function upgradeIsValid(
  upgrade: HydratedUpgrade,
  faction: Faction,
  platform?: HydratedPlatform,
  pilot?: HydratedPilot
): boolean {
  const { upgradeRestrictions } = upgrade;
  const { name: platformName } = platform || {};
  const { standard } = pilot || {};

  if (standard && upgradeRestrictions.standard) {
    return false;
  }

  if (upgradeRestrictions.platform && !upgradeRestrictions.platform.includes(platformName || '')) {
    return false;
  }

  if (upgradeRestrictions.faction && !upgradeRestrictions.faction.includes(faction)) {
    return false;
  }

  if (
    upgradeRestrictions.factionOrUnique?.faction &&
    upgradeRestrictions.factionOrUnique.faction !== faction
  ) {
    return false;
  }

  if (upgradeRestrictions.standard && upgradeRestrictions.standard) {
    return false;
  }

  return true;
}

const selectIsStandardLoadoutPilot = createSelector(selectShipPilot, (pilot) => pilot?.standard);

export const selectUpgradeSlotSelected = createSelector(
  [selectShipUpgrades, listSelectorArgsForwarder],
  (selectedUpgradesForShip, { slotId }) => selectedUpgradesForShip?.[slotId!]
);

const EMPTY_UPGRADES_ARRAY: HydratedUpgrade[] = [];

export const selectUpgradeSlotOptionsArray = createSelector(
  [
    selectShipUpgrades,
    selectUpgradeIdsBySlot,
    selectIsStandardLoadoutPilot,
    selectAllUpgradesMap,
    selectShipPlatform,
    selectShipPilot,
    listSelectorArgsForwarder,
  ],
  (
    selectedUpgradesForShip,
    upgradesIdsBySlot,
    standard,
    allUpgradesMap,
    platform,
    pilot,
    { faction, slotId, slotType }
  ) => {
    if (!faction || !slotId || !slotType) {
      return EMPTY_UPGRADES_ARRAY;
    }
    const selected = selectedUpgradesForShip?.[slotId];

    if (standard && selected) {
      return EMPTY_UPGRADES_ARRAY;
    }

    const options = (upgradesIdsBySlot[slotType] || []).reduce((acc, upgradeId) => {
      const upgrade = allUpgradesMap[upgradeId];
      if (upgradeIsValid(upgrade, faction!, platform, pilot)) {
        acc.push(upgrade);
      }
      return acc;
    }, [] as HydratedUpgrade[]);

    return options;
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (a: HydratedUpgrade[], b: HydratedUpgrade[]) =>
        a.length === b.length && a.every((item, index) => item === b[index]),
    },
  }
);

export const selectHasPilot = createSelector(
  [selectListPilots, (_: RootState, pilotName: string) => pilotName],
  (pilots, pilotName) => pilots.some((pilot) => pilot?.name === pilotName)
);
