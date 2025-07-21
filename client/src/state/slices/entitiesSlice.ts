import { Faction, HydratedPilot, HydratedPlatform, HydratedUpgrade } from '@shared/types';

import { EntitiesState } from 'src/types';

import { api } from './apiSlice';
import { createAppSlice } from './createAppSlice';

function createEmptyEntitiesState(): EntitiesState {
  return {
    pilots: {},
    pilotsByPlatform: {},
    platforms: {},
    platformsByFaction: {},
    upgrades: {},
  } as EntitiesState;
}

const reducers = {
  clearAllEntities: () => {
    return createEmptyEntitiesState();
  },
  clearPilots: (state: EntitiesState) => {
    state.pilots = {} as Record<number, HydratedPilot>;
    state.pilotsByPlatform = {} as Record<string, number[]>;
  },
  clearPlatforms: (state: EntitiesState) => {
    state.platforms = {} as Record<number, HydratedPlatform>;
    state.platformsByFaction = {} as Record<Faction, number[]>;
  },
  clearUpgrades: (state: EntitiesState) => {
    state.upgrades = {} as Record<number, HydratedUpgrade>;
  },
};

const initialState: EntitiesState = createEmptyEntitiesState();

const entitiesSlice = createAppSlice({
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.fetchAllPlatforms.matchFulfilled, (state, action) => {
        const platforms = action.payload;

        const platformsByFaction: Record<Faction, number[]> = {
          [Faction.empire]: [],
          [Faction.firstorder]: [],
          [Faction.rebels]: [],
          [Faction.republic]: [],
          [Faction.resistance]: [],
          [Faction.scum]: [],
          [Faction.separatists]: [],
        };

        const platformsById = platforms.reduce(
          (acc, platform) => {
            const { factions, id } = platform;
            acc[id] = platform;

            factions.forEach((faction) => {
              platformsByFaction[faction as Faction].push(id);
            });

            return acc;
          },
          {} as { [id: number]: HydratedPlatform }
        );

        state.platforms = { ...state.platforms, ...platformsById };
        state.platformsByFaction = platformsByFaction;
      })
      .addMatcher(api.endpoints.fetchAllPilots.matchFulfilled, (state, action) => {
        const pilots = action.payload;

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
        // state.pilotsByPlatform[platformName] = pilotsInPlatform;
      })
      .addMatcher(api.endpoints.fetchAllUpgrades.matchFulfilled, (state, action) => {
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
