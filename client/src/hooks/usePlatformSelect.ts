import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectPlatformsByFaction, selectShipPlatform } from '@selectors';
import { selectPlatformId } from 'src/state/slices/listSlice';

import { useAppDispatch } from './state';
import { useTypedParams } from './useTypedParams';

import type { RootState } from '@types';

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const platforms = useSelector((state: RootState) => selectPlatformsByFaction(state, faction));
  const selected = useSelector((state: RootState) => selectShipPlatform(state, { shipId }));

  const options = useMemo(() => {
    return platforms.map((platform) => ({
      label: platform.name,
      value: platform.id,
    }));
  }, [platforms]);

  const onSelect = useCallback(
    (platformId?: number) => {
      dispatch(selectPlatformId({ platformId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
