import { useCallback, useMemo } from 'react';

import { getUpgradeCost } from '@/rules/pointsRules';
import { getUpgradeOptions } from '@/rules/upgradeRules';
import { selectShipById } from '@/state/selectors/list';
import { chooseUpgrade } from '@/state/slices/listSlice';
import { withPoints } from '@/strings/points';
import { withDisallowedChoice } from '@/utils/withDisallowedChoice';

import { useAppDispatch, useAppSelector } from './state';
import { useSquad } from './useSquad';

interface UpgradeSelectArgs {
  shipId: string;
  slotId: string;
  slotType: string;
}

export function useUpgradeSelect({ shipId, slotId, slotType }: UpgradeSelectArgs) {
  const dispatch = useAppDispatch();
  const { factionXws, format, isLoading, points, squad, upgrades, upgradesByXws } = useSquad();
  const selected = useAppSelector((state) => selectShipById(state, shipId)?.upgrades[slotId]);

  const options = useMemo(() => {
    const context = { factionXws, format, shipId, slotId, squad };
    const legal = getUpgradeOptions(upgrades, slotType, context, points).map((upgrade) => ({
      label: withPoints(upgrade.name, getUpgradeCost(points, upgrade.xws, factionXws)),
      value: upgrade.xws,
    }));
    const current = selected ? upgradesByXws.get(selected) : undefined;
    return withDisallowedChoice(legal, current && { label: current.name, value: current.xws });
  }, [
    factionXws,
    format,
    points,
    selected,
    shipId,
    slotId,
    slotType,
    squad,
    upgrades,
    upgradesByXws,
  ]);

  const onSelect = useCallback(
    (upgradeXws?: string) => {
      dispatch(chooseUpgrade({ shipId, slotId, upgradeXws }));
    },
    [dispatch, shipId, slotId]
  );

  return { isLoading, onClear: onSelect, onSelect, options, selected };
}
