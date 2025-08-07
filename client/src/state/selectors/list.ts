import { createSelector } from '@reduxjs/toolkit';
import { DefaultOptionType } from 'antd/es/select';

import { SLOT_ORDER } from 'src/constants';

import {
  selectAllPilotsMap,
  selectAllPlatformsMap,
  selectAllUpgradesMap,
  selectPilotIdsByPlatformMap,
  selectUpgradeIdsBySlot,
} from './entities';
import {
  type HydratedSelectedUpgrades,
  type HydratedShipState,
  upgradeIsEnabled,
  upgradeIsRelevant,
} from './upgradeLogicHelpers';

import { Faction, HydratedPilot, HydratedUpgrade } from '@shared/types';
import { RootState, ShipId, SlotId } from '@types';

type ListSelectorArgs = {
  faction?: Faction;
  shipId?: string;
  slotId?: SlotId;
  slotType?: string;
};

function listSelectorArgsForwarder(_: RootState, args: ListSelectorArgs) {
  return args;
}

const selectListState = (state: RootState) => state.list;
export const selectListShips = (state: RootState) => state.list.ships;
export const selectShipOrderIds = (state: RootState) => state.list.shipOrder;

const selectHydratedListState = createSelector(
  [selectListState, selectAllPilotsMap, selectAllPlatformsMap, selectAllUpgradesMap],
  (listState, pilotsMap, platformsMap, upgradesMap) => {
    const { shipOrder, ships } = listState;

    const hydratedShips = shipOrder.reduce(
      (accum, shipId) => {
        const { pilot: pilotId, platform: platformId, upgrades: slotMap } = ships[shipId];

        if (!platformId || !pilotId) {
          return accum;
        }

        const hydratedUpgrades = Object.entries(slotMap).reduce((acc, [slotId, upgradeId]) => {
          if (upgradeId !== null) {
            acc[slotId] = upgradesMap[upgradeId];
          } else {
            acc[slotId] = null;
          }

          return acc;
        }, {} as HydratedSelectedUpgrades);

        const hydrated = {
          id: shipId,
          pilot: pilotsMap[pilotId],
          platfrom: platformsMap[platformId],
          upgrades: hydratedUpgrades,
        };

        accum[shipId] = hydrated;

        return accum;
      },
      {} as Record<ShipId, HydratedShipState>
    );
    return {
      shipOrder,
      ships: hydratedShips,
    };
  }
);

export const selectSpecificShip = createSelector(
  [selectListShips, listSelectorArgsForwarder],
  (listShips, { shipId }) => {
    // console.log('selectSpecificShip recomputing');
    return listShips[shipId!];
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

export const selectIsStandardLoadoutPilot = createSelector(
  selectShipPilot,
  (pilot) => pilot?.standard
);

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
    selectHydratedListState,
    listSelectorArgsForwarder,
  ],
  (
    selectedUpgradesForShip,
    upgradesIdsBySlot,
    standard,
    allUpgradesMap,
    hydratedListState,
    { faction, shipId, slotId, slotType }
  ) => {
    if (!faction || !slotId || !slotType) {
      return {
        options: EMPTY_UPGRADES_ARRAY,
        selected: undefined,
        standard,
      };
    }
    const selected = selectedUpgradesForShip?.[slotId];

    if (standard && selected) {
      return {
        options: EMPTY_UPGRADES_ARRAY,
        selected,
        standard,
      };
    }

    const options = (upgradesIdsBySlot[slotType] || []).reduce((acc, upgradeId) => {
      const upgrade = allUpgradesMap[upgradeId];
      const isRelevant = upgradeIsRelevant(
        upgrade,
        { faction, shipId: shipId!, slotId, slotType },
        hydratedListState
      );
      if (isRelevant) {
        const enabled = upgradeIsEnabled(
          upgrade,
          { faction, shipId: shipId!, slotId, slotType },
          hydratedListState
        );

        const label = `${upgrade.name} (${upgrade.points})`;
        const value = upgrade.id;

        acc.push({
          disabled: !enabled,
          label,
          value,
        });
      }
      return acc;
    }, [] as DefaultOptionType[]);

    return {
      options,
      selected,
      standard,
    };
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (
        a: {
          options: HydratedUpgrade[];
          selected: HydratedUpgrade | undefined;
          standard: boolean;
        },
        b: {
          options: HydratedUpgrade[];
          selected: HydratedUpgrade | undefined;
          standard: boolean;
        }
      ) =>
        a.options.length === b.options.length &&
        a.options.every((item, index) => item === b.options[index]) &&
        a.selected === b.selected,
    },
  }
);
