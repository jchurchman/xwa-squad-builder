import { useCallback, useMemo } from 'react';

import { selectShipById } from '@selectors';
import { FACTION_XWS } from 'src/constants';
import type { Ship } from 'src/gen/xwa/cards/v1/cards_pb';
import { useListShipsQuery } from 'src/state/slices/apiSlice';
import { choosePlatform } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

const NO_SHIPS: Ship[] = [];

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const { data: ships = NO_SHIPS } = useListShipsQuery(FACTION_XWS[faction]);
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

  return { onClear: onSelect, onSelect, options, selected };
}
