import { HydratedPilot, HydratedPlatform, HydratedUpgrade } from '@shared/types';

import { EntitiesState } from 'src/types';

import { api } from './apiSlice';
import { createAppSlice } from './createAppSlice';

const initialState: EntitiesState = {
  pilots: {},
  pilotsByPlatform: {},
  platforms: {},
  platformsByFaction: {},
  upgrades: {},
};

const reducers = {
  clearAllEntities: (state: EntitiesState) => {
    state.platforms = {};
    state.pilots = {};
    state.upgrades = {};
    state.platformsByFaction = {};
    state.pilotsByPlatform = {};
  },
  clearPilots: (state: EntitiesState) => {
    state.pilots = {};
    state.pilotsByPlatform = {};
  },
  clearPlatforms: (state: EntitiesState) => {
    state.platforms = {};
    state.platformsByFaction = {};
  },
  clearUpgrades: (state: EntitiesState) => {
    state.upgrades = {};
  },
};

const entitiesSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.fetchPlatformsByFaction.matchFulfilled, (state, action) => {
        const platforms = action.payload;
        const faction = action.meta.arg.originalArgs;

        const platformsInFaction: number[] = [];
        const platformsById = platforms.reduce(
          (acc, platform) => {
            acc[platform.id] = platform;
            platformsInFaction.push(platform.id);
            return acc;
          },
          {} as { [id: number]: HydratedPlatform }
        );

        state.platforms = { ...state.platforms, ...platformsById };
        state.platformsByFaction[faction] = platformsInFaction;
      })
      .addMatcher(api.endpoints.fetchPilotsByPlatform.matchFulfilled, (state, action) => {
        const pilots = action.payload;
        const platformName = action.meta.arg.originalArgs;

        const pilotsInPlatform: number[] = [];
        const pilotsById = pilots.reduce(
          (acc, pilot) => {
            acc[pilot.id] = pilot;
            pilotsInPlatform.push(pilot.id);
            return acc;
          },
          {} as { [id: number]: HydratedPilot }
        );

        state.pilots = { ...state.pilots, ...pilotsById };
        state.pilotsByPlatform[platformName] = pilotsInPlatform;
      })
      .addMatcher(api.endpoints.fetchUpgradesBySlots.matchFulfilled, (state, action) => {
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

export const { clearAllEntities, clearPilots, clearPlatforms, clearUpgrades } =
  entitiesSlice.actions;

export default entitiesSlice.reducer;
