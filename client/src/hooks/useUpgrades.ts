import { useMemo } from 'react';

import type { Upgrade } from '@/gen/xwa/cards/v1/cards_pb';
import { useListUpgradesQuery } from '@/state/slices/apiSlice';

const NO_UPGRADES: Upgrade[] = [];

/** Every upgrade card, plus a lookup by XWS ID. Every caller shares one cached query. */
export function useUpgrades() {
  const { data = NO_UPGRADES, isError, isLoading } = useListUpgradesQuery();

  const upgradesByXws = useMemo(
    () => new Map(data.map((upgrade) => [upgrade.xws, upgrade])),
    [data]
  );

  return { isError, isLoading, upgrades: data, upgradesByXws };
}
