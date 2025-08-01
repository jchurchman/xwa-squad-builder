import { useCallback } from 'react';

import { selectUpgradeSlotStateProps } from '@selectors';
import { chooseUpgrade } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

import { UpgradeId } from '@shared/types';

export function useUpgradeSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const upgradeSlotProps = useAppSelector((state) =>
    selectUpgradeSlotStateProps(state, { faction, shipId })
  );

  const onSelect = useCallback(
    (slotId: string, upgradeId?: UpgradeId) => {
      dispatch(chooseUpgrade({ shipId, slotId, upgradeId }));
    },
    [dispatch, shipId]
  );

  return {
    onClear: (slotId: string) => onSelect(slotId),
    onSelect,
    upgradeSlotProps,
  };
}
