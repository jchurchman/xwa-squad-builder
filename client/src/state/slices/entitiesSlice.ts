import { api } from './apiSlice';
import { createAppSlice } from './createAppSlice';

import { Faction, HydratedPilot, HydratedPlatform, HydratedUpgrade } from '@shared/types';
import { EntitiesState } from '@types';

function createEmptyEntitiesState(): EntitiesState {
  return {
    pilotIdsByPlatform: {},
    pilots: {},
    platformIdsByFaction: {},
    platforms: {},
    upgrades: {},
  } as EntitiesState;
}

const reducers = {
  clearAllEntities: () => {
    return createEmptyEntitiesState();
  },
  clearPilots: (state: EntitiesState) => {
    state.pilots = {} as Record<number, HydratedPilot>;
    state.pilotIdsByPlatform = {} as Record<string, number[]>;
  },
  clearPlatforms: (state: EntitiesState) => {
    state.platforms = {} as Record<number, HydratedPlatform>;
    state.platformIdsByFaction = {} as Record<Faction, number[]>;
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
        state.platformIdsByFaction = platformsByFaction;
      })
      .addMatcher(api.endpoints.fetchAllPilots.matchFulfilled, (state, action) => {
        const pilots = action.payload;

        const pilotsByPlatform: Record<string, number[]> = {};
        const pilotsById = pilots.reduce(
          (acc, pilot) => {
            const { id, platform } = pilot;
            acc[id] = pilot;

            if (pilotsByPlatform[platform || '']) {
              pilotsByPlatform[platform || ''].push(id);
            } else {
              pilotsByPlatform[platform || ''] = [id];
            }

            return acc;
          },
          {} as { [id: number]: HydratedPilot }
        );

        state.pilots = { ...state.pilots, ...pilotsById };
        state.pilotIdsByPlatform = pilotsByPlatform;
      })
      .addMatcher(api.endpoints.fetchAllUpgrades.matchFulfilled, (state, action) => {
        const upgrades = action.payload;

        const upgradeIdsBySlot: Record<string, number[]> = {};

        const upgradesById = upgrades.reduce(
          (acc, upgrade) => {
            acc[upgrade.id] = upgrade;
            const slots = upgrade.upgradeRestrictions?.slots || [];
            const slotType = slots[0];
            if (!upgradeIdsBySlot[slotType]) {
              upgradeIdsBySlot[slotType] = [];
            }
            upgradeIdsBySlot[slotType].push(upgrade.id);
            return acc;
          },
          {} as { [id: number]: HydratedUpgrade }
        );
        console.log(upgradesById);
        state.upgrades = { ...state.upgrades, ...upgradesById };
        state.upgradeIdsBySlot = upgradeIdsBySlot;
      });
  },
  initialState,
  name: 'entities',
  reducers,
});

export const { clearAllEntities, clearPilots, clearPlatforms, clearUpgrades } =
  entitiesSlice.actions;

export default entitiesSlice.reducer;
