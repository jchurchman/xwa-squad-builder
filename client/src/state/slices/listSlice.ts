import { createAsyncThunk } from '@reduxjs/toolkit';
import { HydratedPilot, UpgradeId } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

import {
  ConstructedShipId,
  ConstructedShipState,
  Faction,
  ListState,
  SelectedUpgrades,
} from 'src/types';

import { GetState, RootState } from '..';
import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

const initialState: ListState = {
  constructedShipOrder: [],
  ships: {},
};

function defaultShipByFaction(getState: GetState, faction: Faction) {
  const {
    entities: { shipsByFaction },
  } = getState() as RootState;
  const defaultShipId = shipsByFaction[faction][0];

  return defaultShipId;
}

function makeCreateAsyncThunkWithDefaultShipIdByFaction(actionName: string) {
  return createAsyncThunk<{ defaultShip: number }, Faction, { state: RootState }>(
    actionName,
    async (faction, { getState }) => {
      const defaultShip = defaultShipByFaction(getState, faction);
      return { defaultShip };
    }
  );
}

export const addShip = makeCreateAsyncThunkWithDefaultShipIdByFaction('list/addShip');

export const newList = makeCreateAsyncThunkWithDefaultShipIdByFaction('list/newList');

function newShipWithDefaultShipId(defaultShipId: number) {
  const id = uuidv4();
  const newShip: ConstructedShipState = {
    id,
    ship: defaultShipId,
  };

  return newShip;
}

export const selectPilot = createAsyncThunk<
  { constructedShipId: ConstructedShipId; pilot: HydratedPilot },
  { constructedShipId: ConstructedShipId; pilotId: number },
  { state: RootState }
>('list/selectPilot', async ({ constructedShipId, pilotId }, { getState }) => {
  const {
    entities: { pilots },
  } = getState();

  return {
    constructedShipId,
    pilot: pilots[pilotId],
  };
});

const reducers = {
  clearUpgrade: (
    state: ListState,
    action: PayloadAction<{ shipId: ConstructedShipId; slotIndex?: number; upgradeSlot: string }>
  ) => {
    const { shipId, slotIndex, upgradeSlot } = action.payload;

    // TODO: Pull this into a function that's typed better
    state.ships[shipId].upgrades![upgradeSlot][slotIndex || 0] = null;
  },
  deleteShip: (state: ListState, action: PayloadAction<string>) => {
    delete state.ships[action.payload];
    state.constructedShipOrder = state.constructedShipOrder.filter((id) => id !== action.payload);
    return state;
  },
  selectShipId: (
    state: ListState,
    action: PayloadAction<{ constructedShipId: ConstructedShipId, chassisId: number }>
  ) => {
    state.ships[action.payload.constructedShipId].ship = action.payload.chassisId

    return state;
  },
  selectUpgrade: (
    state: ListState,
    action: PayloadAction<{
      shipId: ConstructedShipId;
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

function addShipToState(state: ListState, newShip: ConstructedShipState) {
  return {
    constructedShipOrder: state.constructedShipOrder.slice().concat(newShip.id),
    ships: {
      ...state.ships,
      [newShip.id]: newShip,
    },
  };
}

const listSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addCase(addShip.fulfilled, (state, action) => {
        const newShip = newShipWithDefaultShipId(action.payload.defaultShip);
        return addShipToState(state, newShip);
      })
      .addCase(newList.fulfilled, (_, action) => {
        const newShip = newShipWithDefaultShipId(action.payload.defaultShip);

        return addShipToState(initialState, newShip);
      })
      .addCase(selectPilot.fulfilled, (state, action) => {
        const { constructedShipId, pilot } = action.payload;
        const thisShip = state.ships[constructedShipId];
        thisShip.pilot = pilot.id;
        thisShip.upgrades = {} as SelectedUpgrades;

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
  clearUpgrade,
  selectShipId,
  selectUpgrade,
  deleteShip,

} = listSlice.actions
