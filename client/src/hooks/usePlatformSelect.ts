import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectPlatformsByFaction, selectShipPlatform } from '@selectors';
import { selectPlatformId } from 'src/state/slices/listSlice';

import { useAppDispatch } from './state';
import { useTypedParams } from './useTypedParams';

import type { RootState } from '@types';

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const options = useSelector((state: RootState) => selectPlatformsByFaction(state, faction));
  const selected = useSelector((state: RootState) => selectShipPlatform(state, shipId));

  const onSelect = useCallback(
    (platformId?: number) => {
      dispatch(selectPlatformId({ platformId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
