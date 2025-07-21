import { createAsyncThunk } from '@reduxjs/toolkit';
import { Faction, HydratedPilot, UpgradeId } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

import { ListState, SelectedUpgrades, ShipId, ShipState } from 'src/types';

import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

import { GetState, RootState } from '@types';

const initialState: ListState = {
  shipOrder: [],
  ships: {},
};

function createInitialUpgrades(): SelectedUpgrades {
  return {} as SelectedUpgrades;
}

function defaultPlatformByFaction(getState: GetState, faction: Faction) {
  const {
    entities: { platformsByFaction },
  } = getState() as RootState;
  const defaultPlatformId = platformsByFaction[faction][0];

  return defaultPlatformId;
}

function makeCreateAsyncThunkWithDefaultPlatformIdByFaction(actionName: string) {
  return createAsyncThunk<{ defaultPlatform: number }, Faction, { state: RootState }>(
    actionName,
    async (faction, { getState }) => {
      const defaultPlatform = defaultPlatformByFaction(getState, faction);
      return { defaultPlatform };
    }
  );
}

export const addShip = makeCreateAsyncThunkWithDefaultPlatformIdByFaction('list/addShip');

export const newList = makeCreateAsyncThunkWithDefaultPlatformIdByFaction('list/newList');

function newShipWithDefaultPlatformId(defaultPlatformId: number) {
  const id = uuidv4();
  const newPlatform: ShipState = {
    id,
    platform: defaultPlatformId,
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
  selectPlatformId: (
    state: ListState,
    action: PayloadAction<{ platformId: number; shipId: ShipId }>
  ) => {
    state.ships[action.payload.shipId].platform = action.payload.platformId;

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

function addShipToState(state: ListState, newPlatform: ShipState) {
  return {
    shipOrder: state.shipOrder.slice().concat(newPlatform.id),
    ships: {
      ...state.ships,
      [newPlatform.id]: newPlatform,
    },
  };
}

const listSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addCase(addShip.fulfilled, (state, action) => {
        const newPlatform = newShipWithDefaultPlatformId(action.payload.defaultPlatform);
        return addShipToState(state, newPlatform);
      })
      .addCase(newList.fulfilled, (_, action) => {
        const newPlatform = newShipWithDefaultPlatformId(action.payload.defaultPlatform);

        return addShipToState(initialState, newPlatform);
      })
      .addCase(selectPilot.fulfilled, (state, action) => {
        const { pilot, shipId } = action.payload;
        const thisPlatform = state.ships[shipId];
        thisPlatform.pilot = pilot.id;
        thisPlatform.upgrades = createInitialUpgrades();

        // TODO: Pull this into a function that's typed better
        pilot.slots.forEach((slotName) => {
          if (!thisPlatform.upgrades![slotName]) {
            thisPlatform.upgrades![slotName] = [null];
          } else {
            thisPlatform.upgrades![slotName].push(null);
          }
        });
      });
  },
  initialState,
  name: 'list',
  reducers,
});

export default listSlice.reducer;
export const { clearUpgrade, deleteShip, selectPlatformId, selectUpgrade } = listSlice.actions;
