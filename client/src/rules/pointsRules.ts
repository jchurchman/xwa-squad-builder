import type { PilotCost, PointsVersion, UpgradeCost } from '@/gen/xwa/points/v1/points_pb';

import type { SquadShip } from './upgradeRules';

/** The faction ID of an upgrade cost row that applies to every faction. */
const ALL_FACTIONS = '';

/** A points version's costs, looked up by XWS ID (docs/architecture.md, D4). */
export interface PointsIndex {
  maxListPoints: number;
  pilots: Map<string, PilotCost>;
  /** Upgrade cost rows by upgrade XWS ID, then by faction XWS ID. */
  upgrades: Map<string, Map<string, UpgradeCost>>;
}

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

/**
 * An upgrade's cost for a faction, or undefined when the points version does not price it there.
 * A row for the faction overrides the row for every faction.
 */
export function getUpgradeCost(
  points: PointsIndex,
  upgradeXws: string,
  factionXws: string
): number | undefined {
  const byFaction = points.upgrades.get(upgradeXws);
  return (byFaction?.get(factionXws) ?? byFaction?.get(ALL_FACTIONS))?.cost;
}

/** The total cost of the squad's pilots. Upgrade costs count only against loadout. */
export function getListPoints(squad: SquadShip[], points: PointsIndex): number {
  return squad.reduce(
    (total, squadShip) => total + (points.pilots.get(squadShip.pilot.xws)?.cost ?? 0),
    0
  );
}
