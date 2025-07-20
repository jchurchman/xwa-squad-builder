import { useParams } from 'react-router';

import { Faction } from 'src/types';

interface RouteParams {
  faction: Faction;
  lang: string;
}

export function useTypedParams(): RouteParams {
  const params = useParams<Partial<RouteParams>>();

  // Ensure params are defined with defaults
  return {
    faction: params.faction || Faction.rebels,
    lang: params.lang || 'en',
  };
}
