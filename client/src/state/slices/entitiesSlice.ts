import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@api';
import { EntitiesState, LoadingState } from '../../types';
import { HydratedPilot, HydratedShip, HydratedUpgrade } from '@shared/types';

const initialLoadingState: LoadingState = {
  loading: false,
  error: null
};

const initialState: EntitiesState = {
  ships: {},
  pilots: {},
  upgrades: {},
  shipsByFaction: {},
  pilotsByShip: {},
  shipsLoading: initialLoadingState,
  pilotsLoading: initialLoadingState,
  upgradesLoading: initialLoadingState
};

export const fetchShipsByFaction = createAsyncThunk(
  'entities/fetchShipsByFaction',
  async (faction: string) => {
    const ships = await api.get<HydratedShip[]>(`/api/ships?faction=${encodeURIComponent(faction)}`);
    return { ships, faction };
  }
);

export const fetchPilotsByShip = createAsyncThunk(
  'entities/fetchPilotsByShip',
  async (shipName: string) => {
    const pilots = await api.get<HydratedPilot[]>(`/api/pilots?ship=${encodeURIComponent(shipName)}`);
    return { pilots, shipName };
  }
);

export const fetchUpgradesBySlots = createAsyncThunk(
  'entities/fetchUpgradesBySlots',
  async (slots: string[]) => {
    const slotsParam = slots.map(slot => `slots=${encodeURIComponent(slot)}`).join('&');
    const upgrades = await api.get<HydratedUpgrade[]>(`/api/upgrades?${slotsParam}`);
    return upgrades;
  }
);

const reducers = {
    clearShips: (state: EntitiesState) => {
      state.ships = {};
      state.shipsByFaction = {};
      state.shipsLoading = initialLoadingState;
    },
    clearPilots: (state: EntitiesState) => {
      state.pilots = {};
      state.pilotsByShip = {};
      state.pilotsLoading = initialLoadingState;
    },
    clearUpgrades: (state: EntitiesState) => {
      state.upgrades = {};
      state.upgradesLoading = initialLoadingState;
    },
    clearAllEntities: (state: EntitiesState) => {
      state.ships = {};
      state.pilots = {};
      state.upgrades = {};
      state.shipsByFaction = {};
      state.pilotsByShip = {};
      state.shipsLoading = initialLoadingState;
      state.pilotsLoading = initialLoadingState;
      state.upgradesLoading = initialLoadingState;
    }
  }

const entitiesSlice = createSlice({
  name: 'entities',
  initialState,
  reducers,
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipsByFaction.pending, (state) => {
        state.shipsLoading.loading = true;
        state.shipsLoading.error = null;
      })
      .addCase(fetchShipsByFaction.fulfilled, (state, action) => {
        state.shipsLoading.loading = false;
        const { ships, faction } = action.payload;
        
        const shipsInFaction: number[] = [];
        const shipsById = ships.reduce((acc, ship) => {
          acc[ship.id] = ship;
          shipsInFaction.push(ship.id);
          return acc;
        }, {} as { [id: number]: HydratedShip });
        
        state.ships = { ...state.ships, ...shipsById };
        state.shipsByFaction[faction] = shipsInFaction;
      })
      .addCase(fetchShipsByFaction.rejected, (state, action) => {
        state.shipsLoading.loading = false;
        state.shipsLoading.error = action.error.message || 'Failed to fetch ships';
      });

    builder
      .addCase(fetchPilotsByShip.pending, (state) => {
        state.pilotsLoading.loading = true;
        state.pilotsLoading.error = null;
      })
      .addCase(fetchPilotsByShip.fulfilled, (state, action) => {
        state.pilotsLoading.loading = false;
        const { pilots, shipName } = action.payload;
        
        const pilotsInShip: number[] = [];
        const pilotsById = pilots.reduce((acc, pilot) => {
          acc[pilot.id] = pilot;
          pilotsInShip.push(pilot.id);
          return acc;
        }, {} as { [id: number]: HydratedPilot });
        
        state.pilots = { ...state.pilots, ...pilotsById };
        state.pilotsByShip[shipName] = pilotsInShip;
      })
      .addCase(fetchPilotsByShip.rejected, (state, action) => {
        state.pilotsLoading.loading = false;
        state.pilotsLoading.error = action.error.message || 'Failed to fetch pilots';
      });

    builder
      .addCase(fetchUpgradesBySlots.pending, (state) => {
        state.upgradesLoading.loading = true;
        state.upgradesLoading.error = null;
      })
      .addCase(fetchUpgradesBySlots.fulfilled, (state, action) => {
        state.upgradesLoading.loading = false;
        const upgrades = action.payload;
        
        // Normalize upgrades by ID and build slot type indexes
        const upgradesById = upgrades.reduce((acc, upgrade) => {
          acc[upgrade.id] = upgrade;
          return acc;
        }, {} as { [id: number]: HydratedUpgrade });
        
        state.upgrades = { ...state.upgrades, ...upgradesById };
      })
      .addCase(fetchUpgradesBySlots.rejected, (state, action) => {
        state.upgradesLoading.loading = false;
        state.upgradesLoading.error = action.error.message || 'Failed to fetch upgrades';
      });
  }
});

export const {
  clearShips,
  clearPilots,
  clearUpgrades,
  clearAllEntities
} = entitiesSlice.actions;

export default entitiesSlice.reducer;