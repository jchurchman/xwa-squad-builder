import { useParams } from 'react-router';

import { FACTION, type Faction } from '@/constants';
import { isFaction } from '@/utils/isFaction';

const DEFAULT_LANG = 'en';

interface RouteParams {
  faction: Faction;
  lang: string;
}

export function useTypedParams(): RouteParams {
  const params = useParams();

  // Layout redirects unknown factions, so the fallback only applies outside the faction routes.
  return {
    faction: isFaction(params.faction) ? params.faction : FACTION.REBELS,
    lang: params.lang || DEFAULT_LANG,
  };
}
