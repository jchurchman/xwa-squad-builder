import { useMemo } from 'react';

import { FACTION_XWS } from '@/constants';
import type { Ship, Upgrade } from '@/gen/xwa/cards/v1/cards_pb';
import type { SquadShip } from '@/rules/upgradeRules';
import { selectList } from '@/state/selectors/list';

import { useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';
import { useTypedParams } from './useTypedParams';
import { useUpgrades } from './useUpgrades';

import type { ListState } from '@/types/state';

const STANDARD_LOADOUT_SLOT_PREFIX = 'standard-';

/** Resolves the list's XWS IDs to cards. Ships without a chosen pilot are left out. */
function listStateToSquad(
  list: ListState,
  ships: Ship[],
  upgradesByXws: Map<string, Upgrade>
): SquadShip[] {
  return list.shipOrder.flatMap((shipId) => {
    const shipState = list.ships[shipId];
    const ship = ships.find((s) => s.xws === shipState.platformXws);
    const pilot = ship?.pilots.find((p) => p.xws === shipState.pilotXws);
    if (!ship || !pilot) {
      return [];
    }

    const upgrades: Record<string, Upgrade> = {};
    if (pilot.standardLoadout.length > 0) {
      pilot.standardLoadout.forEach((xws, index) => {
        const upgrade = upgradesByXws.get(xws);
        if (upgrade) {
          upgrades[`${STANDARD_LOADOUT_SLOT_PREFIX}${index}`] = upgrade;
        }
      });
    } else {
      for (const [slotId, xws] of Object.entries(shipState.upgrades)) {
        const upgrade = upgradesByXws.get(xws);
        if (upgrade) {
          upgrades[slotId] = upgrade;
        }
      }
    }

    return [{ id: shipId, pilot, ship, upgrades }];
  });
}

/** The current faction's squad resolved to cards, plus every upgrade card. */
export function useSquad() {
  const { faction } = useTypedParams();
  const ships = useFactionShips();
  const { upgrades, upgradesByXws, ...upgradesQuery } = useUpgrades();
  const list = useAppSelector(selectList);

  const squad = useMemo(
    () => listStateToSquad(list, ships.ships, upgradesByXws),
    [list, ships.ships, upgradesByXws]
  );

  return {
    factionXws: FACTION_XWS[faction],
    isLoading: ships.isLoading || upgradesQuery.isLoading,
    squad,
    upgrades,
    upgradesByXws,
  };
}
