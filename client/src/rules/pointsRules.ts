import type { PointsVersion, UpgradeCost } from '@/gen/xwa/points/v1/points_pb';

import type { Format } from '@/types/format';
import type { PointsIndex } from '@/types/points';

import type { SquadShip } from './upgradeRules';

/** The faction ID of an upgrade cost row that applies to every faction. */
const ALL_FACTIONS = '';

/** Indexes a points version. With no version, nothing is priced. */
export function indexPointsVersion(version: PointsVersion | undefined): PointsIndex {
  const upgrades = new Map<string, Map<string, UpgradeCost>>();
  for (const cost of version?.upgradeCosts ?? []) {
    const byFaction = upgrades.get(cost.upgradeXws) ?? new Map<string, UpgradeCost>();
    upgrades.set(cost.upgradeXws, byFaction.set(cost.factionXws, cost));
  }

  return {
    maxListPoints: version?.maxListPoints ?? 0,
    pilots: new Map((version?.pilotCosts ?? []).map((cost) => [cost.pilotXws, cost])),
    upgrades,
  };
}

/** An upgrade's cost row for a faction. A row for the faction overrides the row for every faction. */
function getUpgradeCostRow(
  points: PointsIndex,
  upgradeXws: string,
  factionXws: string
): UpgradeCost | undefined {
  const byFaction = points.upgrades.get(upgradeXws);
  return byFaction?.get(factionXws) ?? byFaction?.get(ALL_FACTIONS);
}

/** An upgrade's cost for a faction, or undefined when the points version does not price it there. */
export function getUpgradeCost(
  points: PointsIndex,
  upgradeXws: string,
  factionXws: string
): number | undefined {
  return getUpgradeCostRow(points, upgradeXws, factionXws)?.cost;
}

/** Whether the points version prices the upgrade for the faction and allows it in the format. */
export function isUpgradeLegal(
  points: PointsIndex,
  upgradeXws: string,
  factionXws: string,
  format: Format
): boolean {
  const row = getUpgradeCostRow(points, upgradeXws, factionXws);
  return row?.cost !== undefined && row.formats.includes(format);
}

/** Whether the points version allows the pilot in the format. */
export function isPilotLegal(points: PointsIndex, pilotXws: string, format: Format): boolean {
  return points.pilots.get(pilotXws)?.formats.includes(format) ?? false;
}

/** The most a pilot's upgrades may cost together. */
export function getLoadout(points: PointsIndex, pilotXws: string): number {
  return points.pilots.get(pilotXws)?.loadout ?? 0;
}

/** The total cost of a ship's upgrades, which counts against its pilot's loadout. */
export function getLoadoutPoints(
  squadShip: SquadShip,
  points: PointsIndex,
  factionXws: string
): number {
  return Object.values(squadShip.upgrades).reduce(
    (total, upgrade) => total + (getUpgradeCost(points, upgrade.xws, factionXws) ?? 0),
    0
  );
}

/** The total cost of the squad's pilots. Upgrade costs count only against loadout. */
export function getListPoints(squad: SquadShip[], points: PointsIndex): number {
  return squad.reduce(
    (total, squadShip) => total + (points.pilots.get(squadShip.pilot.xws)?.cost ?? 0),
    0
  );
}
