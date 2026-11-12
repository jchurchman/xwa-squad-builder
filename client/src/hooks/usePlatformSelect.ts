import { useCallback, useMemo } from 'react';

import { selectShipById } from '@/state/selectors/list';
import { choosePlatform } from '@/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const { isLoading, ships } = useFactionShips();
  const selected = useAppSelector((state) => selectShipById(state, shipId)?.platformXws);

  const options = useMemo(
    () => ships.map((ship) => ({ label: ship.name, value: ship.xws })),
    [ships]
  );

  const onSelect = useCallback(
    (platformXws?: string) => {
      dispatch(choosePlatform({ platformXws, shipId }));
    },
    [dispatch, shipId]
  );

  return { isLoading, onClear: onSelect, onSelect, options, selected };
}
