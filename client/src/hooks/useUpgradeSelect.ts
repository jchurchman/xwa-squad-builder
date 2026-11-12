import { useCallback, useMemo } from 'react';

import { selectShipById } from '@selectors';
import { getUpgradeOptions } from 'src/rules/upgradeRules';
import { chooseUpgrade } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useSquad } from './useSquad';

const NOT_ALLOWED_SUFFIX = ' (not allowed)';

interface UpgradeSelectArgs {
  shipId: string;
  slotId: string;
  slotType: string;
}

export function useUpgradeSelect({ shipId, slotId, slotType }: UpgradeSelectArgs) {
  const dispatch = useAppDispatch();
  const { factionXws, isLoading, squad, upgrades, upgradesByXws } = useSquad();
  const selected = useAppSelector((state) => selectShipById(state, shipId)?.upgrades[slotId]);

  const options = useMemo(() => {
    const legal = getUpgradeOptions(upgrades, slotType, { factionXws, shipId, slotId, squad });
    const result = legal.map((upgrade) => ({ label: upgrade.name, value: upgrade.xws }));

    // A choice can become illegal after other changes (e.g. its required pilot is removed).
    // Keep it visible, marked, so the player can see and replace it.
    const current = selected ? upgradesByXws.get(selected) : undefined;
    if (current && !legal.includes(current)) {
      result.unshift({ label: `${current.name}${NOT_ALLOWED_SUFFIX}`, value: current.xws });
    }
    return result;
  }, [factionXws, selected, shipId, slotId, slotType, squad, upgrades, upgradesByXws]);

  const onSelect = useCallback(
    (upgradeXws?: string) => {
      dispatch(chooseUpgrade({ shipId, slotId, upgradeXws }));
    },
    [dispatch, shipId, slotId]
  );

  return { isLoading, onClear: onSelect, onSelect, options, selected };
}
