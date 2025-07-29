import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

import type { HydratedPilot, UpgradeId } from '@shared/types';
import type { RootState } from '@types';
import type { ListState, SelectedUpgrades, ShipId, ShipState } from '@types';

const initialState: ListState = {
  shipOrder: [],
  ships: {},
};

function createInitialUpgrades(): SelectedUpgrades {
  return {} as SelectedUpgrades;
}

function createNewShip() {
  const id = uuidv4();
  const newPlatform: ShipState = {
    id,
  };

  return newPlatform;
}

export const selectPilot = createAsyncThunk<
  { pilot: HydratedPilot; shipId: ShipId },
  { pilotId: number; shipId: ShipId },
  { state: RootState }
>('list/selectPilot', async ({ pilotId, shipId }, { getState }) => {
  const {
    entities: { pilots },
  } = getState();

  return {
    pilot: pilots[pilotId],
    shipId,
  };
});

const reducers = {
  addShip: (state: ListState) => {
    const newShip = createNewShip();
    return addShipToState(state, newShip);
  },
  clearUpgrade: (
    state: ListState,
    action: PayloadAction<{ shipId: ShipId; slotIndex?: number; upgradeSlot: string }>
  ) => {
    const { shipId, slotIndex, upgradeSlot } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[shipId].upgrades![upgradeSlot][slotIndex || 0] = null;
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
  selectPilotId: (
    state: ListState,
    action: PayloadAction<{ pilotId: number | undefined; shipId: ShipId }>
  ) => {
    state.ships[action.payload.shipId].pilot = action.payload.pilotId;
    // TODO: figure out how to preserve still valid upgrade selections
    state.ships[action.payload.shipId].upgrades = createInitialUpgrades();

    return state;
  },
  selectPlatformId: (
    state: ListState,
    action: PayloadAction<{ platformId: number | undefined; shipId: ShipId }>
  ) => {
    state.ships[action.payload.shipId].platform = action.payload.platformId;
    state.ships[action.payload.shipId].pilot = undefined;
    state.ships[action.payload.shipId].upgrades = createInitialUpgrades();

    return state;
  },
  selectUpgrade: (
    state: ListState,
    action: PayloadAction<{
      shipId: ShipId;
      slotIndex?: number;
      upgradeId: UpgradeId;
      upgradeSlot: string;
    }>
  ) => {
    const { shipId, slotIndex, upgradeId, upgradeSlot } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[shipId].upgrades![upgradeSlot][slotIndex || 0] = upgradeId;
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
    builder.addCase(selectPilot.fulfilled, (state, action) => {
      const { pilot, shipId } = action.payload;
      const thisShip = state.ships[shipId];
      thisShip.pilot = pilot.id;
      thisShip.upgrades = createInitialUpgrades();

      // TODO: Pull this into a function that's typed better
      pilot.slots.forEach((slotName) => {
        if (!thisShip.upgrades![slotName]) {
          thisShip.upgrades![slotName] = [null];
        } else {
          thisShip.upgrades![slotName].push(null);
        }
      });
    });
  },
  initialState,
  name: 'list',
  reducers,
});

export default listSlice.reducer;
export const {
  addShip,
  clearUpgrade,
  deleteShip,
  newList,
  selectPilotId,
  selectPlatformId,
  selectUpgrade,
} = listSlice.actions;
