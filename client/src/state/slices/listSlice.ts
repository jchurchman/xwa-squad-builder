import { createAsyncThunk } from '@reduxjs/toolkit';
import { HydratedPilot, UpgradeId } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

import { Faction, ListState, SelectedUpgrades, ShipId, ShipState } from 'src/types';

import { GetState, RootState } from '..';
import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

const initialState: ListState = {
  shipOrder: [],
  ships: {},
};

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

export const addPlatform = makeCreateAsyncThunkWithDefaultPlatformIdByFaction('list/addPlatform');

export const newList = makeCreateAsyncThunkWithDefaultPlatformIdByFaction('list/newList');

function newPlatformWithDefaultPlatformId(defaultPlatformId: number) {
  const id = uuidv4();
  const newPlatform: ShipState = {
    id,
    platform: defaultPlatformId,
  };

  return newPlatform;
}

export const selectPilot = createAsyncThunk<
  { pilot: HydratedPilot; shipId: ShipId; },
  { pilotId: number; shipId: ShipId; },
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
    action: PayloadAction<{ platformId: ShipId; slotIndex?: number; upgradeSlot: string }>
  ) => {
    const { platformId, slotIndex, upgradeSlot } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[platformId].upgrades![upgradeSlot][slotIndex || 0] = null;
  },
  deletePlatform: (state: ListState, action: PayloadAction<string>) => {
    delete state.ships[action.payload];
    state.shipOrder = state.shipOrder.filter((id) => id !== action.payload);
    return state;
  },
  selectPlatformId: (
    state: ListState,
    action: PayloadAction<{ chassisId: number; constructedPlatformId: ShipId; }>
  ) => {
    state.ships[action.payload.constructedPlatformId].platform = action.payload.chassisId;

    return state;
  },
  selectUpgrade: (
    state: ListState,
    action: PayloadAction<{
      platformId: ShipId;
      slotIndex?: number;
      upgradeId: UpgradeId;
      upgradeSlot: string;
    }>
  ) => {
    const { platformId, slotIndex, upgradeId, upgradeSlot } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[platformId].upgrades![upgradeSlot][slotIndex || 0] = upgradeId;
  },
};

function addPlatformToState(state: ListState, newPlatform: ShipState) {
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
      .addCase(addPlatform.fulfilled, (state, action) => {
        const newPlatform = newPlatformWithDefaultPlatformId(action.payload.defaultPlatform);
        return addPlatformToState(state, newPlatform);
      })
      .addCase(newList.fulfilled, (_, action) => {
        const newPlatform = newPlatformWithDefaultPlatformId(action.payload.defaultPlatform);

        return addPlatformToState(initialState, newPlatform);
      })
      .addCase(selectPilot.fulfilled, (state, action) => {
        const { pilot, shipId } = action.payload;
        const thisPlatform = state.ships[shipId];
        thisPlatform.pilot = pilot.id;
        thisPlatform.upgrades = {} as SelectedUpgrades;

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
export const { clearUpgrade, deletePlatform, selectPlatformId, selectUpgrade } = listSlice.actions;
