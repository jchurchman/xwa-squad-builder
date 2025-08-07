import { useCallback } from 'react';

import { selectUpgradeSlotOptionsArray } from '@selectors';
import { chooseUpgrade } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

import { UpgradeId } from '@shared/types';

type UpgradeSelectorMetadata = {
  shipId: string;
  slotId: string;
  slotType: string;
};

export function useUpgradeSelector({ shipId, slotId, slotType }: UpgradeSelectorMetadata) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const { options, selected, standard } = useAppSelector((state) =>
    selectUpgradeSlotOptionsArray(state, { faction, shipId, slotId, slotType })
  );

  const onSelect = useCallback(
    (upgradeId?: UpgradeId) => {
      dispatch(chooseUpgrade({ shipId, slotId, upgradeId }));
    },
    [dispatch, shipId, slotId]
  );

  return {
    allowClear: !standard,
    onClear: () => onSelect(),
    onSelect,
    options,
    selected,
  };
}
