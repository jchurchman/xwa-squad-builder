import { FACTION_XWS } from 'src/constants';
import type { Ship } from 'src/gen/xwa/cards/v1/cards_pb';
import { useListShipsQuery } from 'src/state/slices/apiSlice';

import { useTypedParams } from './useTypedParams';

const NO_SHIPS: Ship[] = [];

/** The current faction's ships and pilots. Every caller shares one cached query. */
export function useFactionShips() {
  const { faction } = useTypedParams();
  const { data = NO_SHIPS, isError, isLoading } = useListShipsQuery(FACTION_XWS[faction]);

  return { isError, isLoading, ships: data };
}
