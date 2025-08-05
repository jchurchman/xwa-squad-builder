import { createSelector } from '@reduxjs/toolkit';

import { Faction } from '@shared/types';
import { RootState } from '@types';

export const selectAllPlatforms = (state: RootState) => Object.values(state.entities.platforms);
export const selectAllPlatformsMap = (state: RootState) => state.entities.platforms;
export const selectAllPilots = (state: RootState) => Object.values(state.entities.pilots);
export const selectAllPilotsMap = (state: RootState) => state.entities.pilots;
export const selectPilotIdsByPlatformMap = (state: RootState) => state.entities.pilotIdsByPlatform;
export const selectAllUpgrades = (state: RootState) => Object.values(state.entities.upgrades);
export const selectAllUpgradesMap = (state: RootState) => state.entities.upgrades;
export const selectUpgradeIdsBySlot = (state: RootState) => state.entities.upgradeIdsBySlot;

export const selectPlatformById = (state: RootState, platformId: number) =>
  state.entities.platforms[platformId];

export const selectPilotById = (state: RootState, pilotId: number) =>
  state.entities.pilots[pilotId];

export const selectUpgradeById = (state: RootState, upgradeId: number) =>
  state.entities.upgrades[upgradeId];

export const selectPilotsByFaction = createSelector(
  [selectAllPilots, (_: RootState, faction: string) => faction],
  (pilots, faction) => pilots.filter((pilot) => pilot.faction === faction)
);

export const selectPlatformsByFaction = createSelector(
  [
    selectAllPlatformsMap,
    (state: RootState) => state.entities.platformIdsByFaction,
    (_: RootState, faction: Faction) => faction,
  ],
  (platforms, platformsByFactionMap, faction) => {
    const platformIdsInFaction = platformsByFactionMap[faction] || [];
    return platformIdsInFaction.map((id) => platforms[id]);
  }
);
