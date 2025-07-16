import { HydratedPilot, HydratedShip, HydratedUpgrade } from '@shared/types';

import { EntitiesState } from 'src/types';

import { api } from './apiSlice';
import { createAppSlice } from './createAppSlice';

const initialState: EntitiesState = {
  pilots: {},
  pilotsByShip: {},
  ships: {},
  shipsByFaction: {},
  upgrades: {},
};

const reducers = {
  clearAllEntities: (state: EntitiesState) => {
    state.ships = {};
    state.pilots = {};
    state.upgrades = {};
    state.shipsByFaction = {};
    state.pilotsByShip = {};
  },
  clearPilots: (state: EntitiesState) => {
    state.pilots = {};
    state.pilotsByShip = {};
  },
  clearShips: (state: EntitiesState) => {
    state.ships = {};
    state.shipsByFaction = {};
  },
  clearUpgrades: (state: EntitiesState) => {
    state.upgrades = {};
  },
};

const entitiesSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.getShipsByFaction.matchFulfilled, (state, action) => {
        const ships = action.payload;
        const faction = action.meta.arg.originalArgs;

        const shipsInFaction: number[] = [];
        const shipsById = ships.reduce(
          (acc, ship) => {
            acc[ship.id] = ship;
            shipsInFaction.push(ship.id);
            return acc;
          },
          {} as { [id: number]: HydratedShip }
        );

        state.ships = { ...state.ships, ...shipsById };
        state.shipsByFaction[faction] = shipsInFaction;
      })
      .addMatcher(api.endpoints.fetchPilotsByShip.matchFulfilled, (state, action) => {
        const pilots = action.payload;
        const shipName = action.meta.arg.originalArgs;

        const pilotsInShip: number[] = [];
        const pilotsById = pilots.reduce(
          (acc, pilot) => {
            acc[pilot.id] = pilot;
            pilotsInShip.push(pilot.id);
            return acc;
          },
          {} as { [id: number]: HydratedPilot }
        );

        state.pilots = { ...state.pilots, ...pilotsById };
        state.pilotsByShip[shipName] = pilotsInShip;
      })
      .addMatcher(api.endpoints.getUpgradesBySlots.matchFulfilled, (state, action) => {
        const upgrades = action.payload;

        const upgradesById = upgrades.reduce(
          (acc, upgrade) => {
            acc[upgrade.id] = upgrade;
            return acc;
          },
          {} as { [id: number]: HydratedUpgrade }
        );

        state.upgrades = { ...state.upgrades, ...upgradesById };
      });
  },
  initialState,
  name: 'entities',
  reducers,
});

export const { clearAllEntities, clearPilots, clearShips, clearUpgrades } = entitiesSlice.actions;

export default entitiesSlice.reducer;
