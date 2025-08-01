import { useCallback, useMemo } from 'react';

import { selectPlatformsByFaction, selectShipPlatform } from '@selectors';
import { choosePlatformId } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const platforms = useAppSelector((state) => selectPlatformsByFaction(state, faction));
  const selected = useAppSelector((state) => selectShipPlatform(state, { shipId }));

  const options = useMemo(() => {
    return platforms.map((platform) => ({
      label: platform.name,
      value: platform.id,
    }));
  }, [platforms]);

  const onSelect = useCallback(
    (platformId?: number) => {
      dispatch(choosePlatformId({ platformId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
