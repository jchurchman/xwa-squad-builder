import type { PilotCost, UpgradeCost } from '@/gen/xwa/points/v1/points_pb';

/** A points version's costs, looked up by XWS ID (docs/architecture.md, D4). */
export interface PointsIndex {
  maxListPoints: number;
  pilots: Map<string, PilotCost>;
  /** Upgrade cost rows by upgrade XWS ID, then by faction XWS ID. */
  upgrades: Map<string, Map<string, UpgradeCost>>;
}
