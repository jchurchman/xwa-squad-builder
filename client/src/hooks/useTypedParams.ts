import { useParams } from 'react-router';

import { isFaction } from '@/utils/isFaction';

import { Faction } from '@shared/types';

const DEFAULT_LANG = 'en';

interface RouteParams {
  faction: Faction;
  lang: string;
}

export function useTypedParams(): RouteParams {
  const params = useParams();

  // Layout redirects unknown factions, so the fallback only applies outside the faction routes.
  return {
    faction: isFaction(params.faction) ? params.faction : Faction.rebels,
    lang: params.lang || DEFAULT_LANG,
  };
}
