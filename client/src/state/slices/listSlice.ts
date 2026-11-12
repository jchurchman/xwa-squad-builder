import { v4 as uuidv4 } from 'uuid';

import { createAppSlice } from './createAppSlice';

import type { PayloadAction } from '@reduxjs/toolkit';

import type { ListState, ShipId, ShipState } from '@/types/state';

const initialState: ListState = {
  shipOrder: [],
  ships: {},
};

function createNewShip(): ShipState {
  return { id: uuidv4(), upgrades: {} };
}

function addShipToState(state: ListState, newShip: ShipState): ListState {
  return {
    shipOrder: state.shipOrder.concat(newShip.id),
    ships: {
      ...state.ships,
      [newShip.id]: newShip,
    },
  };
}

const reducers = {
  addShip: (state: ListState) => addShipToState(state, createNewShip()),
  choosePilot: (
    state: ListState,
    action: PayloadAction<{ pilotXws: string | undefined; shipId: ShipId }>
  ) => {
    const ship = state.ships[action.payload.shipId];
    ship.pilotXws = action.payload.pilotXws;
    ship.upgrades = {};
  },
  choosePlatform: (
    state: ListState,
    action: PayloadAction<{ platformXws: string | undefined; shipId: ShipId }>
  ) => {
    const ship = state.ships[action.payload.shipId];
    ship.platformXws = action.payload.platformXws;
    ship.pilotXws = undefined;
    ship.upgrades = {};
  },
  chooseUpgrade: (
    state: ListState,
    action: PayloadAction<{ shipId: ShipId; slotId: string; upgradeXws: string | undefined }>
  ) => {
    const { shipId, slotId, upgradeXws } = action.payload;
    const ship = state.ships[shipId];
    if (upgradeXws) {
      ship.upgrades[slotId] = upgradeXws;
    } else {
      delete ship.upgrades[slotId];
    }
  },
  deleteShip: (state: ListState, action: PayloadAction<ShipId>) => {
    delete state.ships[action.payload];
    state.shipOrder = state.shipOrder.filter((id) => id !== action.payload);
  },
  newList: () => addShipToState(initialState, createNewShip()),
};

const listSlice = createAppSlice({
  initialState,
  name: 'list',
  reducers,
});

export default listSlice.reducer;
export const { addShip, choosePilot, choosePlatform, chooseUpgrade, deleteShip, newList } =
  listSlice.actions;
