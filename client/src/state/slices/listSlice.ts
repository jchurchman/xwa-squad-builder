import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { SLOT_ORDER } from 'src/constants';

import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

import type { HydratedPilot, HydratedPlatform, HydratedUpgrade, UpgradeId } from '@shared/types';
import type { RootState, SlotId } from '@types';
import type { ListState, SelectedUpgrades, ShipId, ShipState } from '@types';

const initialState: ListState = {
  shipOrder: [],
  ships: {},
};

// TODO: Refactor this to preserve slotId keys
function createInitialUpgrades(): SelectedUpgrades {
  return {} as SelectedUpgrades;
}

function createNewShip() {
  const id = uuidv4();
  const newPlatform: ShipState = {
    id,
    upgrades: {},
  };

  return newPlatform;
}

const SLOT_ID_DELIMITER = '-';

type UpgradeSlotMetadata = {
  id: SlotId;
  type: string;
};

const generateSlotIds = (pilotSlots: string[]): UpgradeSlotMetadata[] => {
  const slotCounts: Record<string, number> = {};
  const slotIds: UpgradeSlotMetadata[] = [];

  pilotSlots.forEach((slotType) => {
    slotCounts[slotType] = (slotCounts[slotType] || 0) + 1;
  });

  SLOT_ORDER.forEach((slotType) => {
    const count = slotCounts[slotType] || 0;
    for (let i = 0; i < count; i++) {
      slotIds.push({
        id: `${slotType.toLowerCase()}${SLOT_ID_DELIMITER}${i}`,
        type: slotType,
      });
    }
  });

  return slotIds;
};

const initializeEmptySlots = (slotMetadata: UpgradeSlotMetadata[]): SelectedUpgrades => {
  return slotMetadata.reduce((acc, slot) => {
    acc[slot.id] = null;
    return acc;
  }, {} as SelectedUpgrades);
};

const findCompatibleSlot = (
  upgrade: HydratedUpgrade,
  availableSlots: UpgradeSlotMetadata[]
): UpgradeSlotMetadata | null => {
  if (!upgrade.upgradeRestrictions?.slots) return null;

  return (
    availableSlots.find((slot) => upgrade.upgradeRestrictions?.slots?.includes(slot.type)) || null
  );
};

const equipSingleUpgrade = (
  upgradeId: UpgradeId,
  currentUpgrades: SelectedUpgrades,
  availableSlots: UpgradeSlotMetadata[],
  allUpgrades: Record<UpgradeId, HydratedUpgrade>
): { remainingSlots: UpgradeSlotMetadata[]; upgrades: SelectedUpgrades } => {
  const upgrade = allUpgrades[upgradeId];
  if (!upgrade) {
    return { remainingSlots: availableSlots, upgrades: currentUpgrades };
  }

  const compatibleSlot = findCompatibleSlot(upgrade, availableSlots);
  if (!compatibleSlot) {
    return { remainingSlots: availableSlots, upgrades: currentUpgrades };
  }

  const newUpgrades = {
    ...currentUpgrades,
    [compatibleSlot.id]: upgradeId,
  };

  const remainingSlots = availableSlots.filter((slot) => slot.id !== compatibleSlot.id);

  return { remainingSlots, upgrades: newUpgrades };
};

const equipUpgrades = (
  upgradeIds: UpgradeId[],
  initialUpgrades: SelectedUpgrades,
  initialSlots: UpgradeSlotMetadata[],
  allUpgrades: Record<UpgradeId, HydratedUpgrade>
): SelectedUpgrades => {
  return upgradeIds.reduce(
    (acc, upgradeId) => {
      const result = equipSingleUpgrade(upgradeId, acc.upgrades, acc.remainingSlots, allUpgrades);
      return result;
    },
    { remainingSlots: initialSlots, upgrades: initialUpgrades }
  ).upgrades;
};

const createSelectedUpgradesFromPilotAndPlatform = (
  pilot: HydratedPilot,
  platform: HydratedPlatform | null,
  upgrades: Record<UpgradeId, HydratedUpgrade>
): SelectedUpgrades => {
  const slotMetadata = generateSlotIds(pilot.slots);
  const emptyUpgrades = initializeEmptySlots(slotMetadata);

  const platformUpgradeIds = platform?.autoequip || [];
  const afterPlatformUpgrades = equipUpgrades(
    platformUpgradeIds,
    emptyUpgrades,
    slotMetadata,
    upgrades
  );

  // Calculate remaining slots after platform upgrades
  const usedSlotIds = Object.entries(afterPlatformUpgrades).reduce((acc, [slotId, upgradeId]) => {
    if (upgradeId !== null) {
      acc.push(slotId);
    }
    return acc;
  }, [] as string[]);

  const remainingSlotsAfterPlatform = slotMetadata.filter((slot) => !usedSlotIds.includes(slot.id));

  // Then, equip pilot's default upgrades to remaining slots
  const pilotUpgradeIds = pilot.upgrades || [];
  const finalUpgrades = equipUpgrades(
    pilotUpgradeIds,
    afterPlatformUpgrades,
    remainingSlotsAfterPlatform,
    upgrades
  );

  return finalUpgrades;
};

export const choosePilotId = createAsyncThunk<
  {
    pilot: HydratedPilot | null;
    shipId: ShipId;
    upgrades: SelectedUpgrades;
  },
  { pilotId?: number; shipId: ShipId },
  { state: RootState }
>('list/choosePilotId', async ({ pilotId, shipId }, { getState }) => {
  console.log('choosePilotId thunk ', pilotId);

  const state = getState();
  const {
    entities: { pilots, platforms, upgrades },
    list: { ships },
  } = state;

  const ship = ships[shipId];
  const platform = ship?.platform ? platforms[ship.platform] : null;

  if (!pilotId) {
    return {
      pilot: null,
      shipId,
      upgrades: {}, // Empty upgrades object when no pilot
    };
  }

  const pilot = pilots[pilotId];
  const selectedUpgrades = createSelectedUpgradesFromPilotAndPlatform(pilot, platform, upgrades);

  console.log({ pilot, selectedUpgrades });
  return {
    pilot,
    shipId,
    upgrades: selectedUpgrades,
  };
});

const reducers = {
  addShip: (state: ListState) => {
    const newShip = createNewShip();
    return addShipToState(state, newShip);
  },
  choosePlatformId: (
    state: ListState,
    action: PayloadAction<{ platformId: number | undefined; shipId: ShipId }>
  ) => {
    state.ships[action.payload.shipId].platform = action.payload.platformId;
    state.ships[action.payload.shipId].pilot = undefined;
    state.ships[action.payload.shipId].upgrades = createInitialUpgrades();

    return state;
  },
  chooseUpgrade: (
    state: ListState,
    action: PayloadAction<{
      shipId: ShipId;
      slotId: string;
      upgradeId?: UpgradeId;
    }>
  ) => {
    const { shipId, slotId, upgradeId } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[shipId].upgrades![slotId] = upgradeId || null;
  },
  deleteShip: (state: ListState, action: PayloadAction<string>) => {
    delete state.ships[action.payload];
    state.shipOrder = state.shipOrder.filter((id) => id !== action.payload);
    return state;
  },
  newList: () => {
    const newShip = createNewShip();
    return addShipToState(initialState, newShip);
  },
};

function addShipToState(state: ListState, newShip: ShipState) {
  return {
    shipOrder: state.shipOrder.slice().concat(newShip.id),
    ships: {
      ...state.ships,
      [newShip.id]: newShip,
    },
  };
}

const listSlice = createAppSlice({
  extraReducers: (builder) => {
    builder.addCase(choosePilotId.fulfilled, (state, action) => {
      const { pilot, shipId, upgrades } = action.payload;

      if (!state.ships[shipId]) {
        state.ships[shipId] = { id: shipId, upgrades: {} };
      }

      state.ships[shipId].pilot = pilot?.id;

      if (upgrades) {
        state.ships[shipId].upgrades = upgrades;
      }
    });
  },
  initialState,
  name: 'list',
  reducers,
});

export default listSlice.reducer;
export const { addShip, choosePlatformId, chooseUpgrade, deleteShip, newList } = listSlice.actions;
