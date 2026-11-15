import { useParams, useSearchParams } from 'react-router';

import { DEFAULT_FORMAT, FACTION, FORMAT_PARAM } from '@/constants';
import { isFaction } from '@/utils/isFaction';
import { isFormat } from '@/utils/isFormat';

import type { Faction } from '@/types/faction';
import type { Format } from '@/types/format';

const DEFAULT_LANG = 'en';

interface RouteParams {
  faction: Faction;
  format: Format;
  lang: string;
}

export function useTypedParams(): RouteParams {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const format = searchParams.get(FORMAT_PARAM);

  // Layout redirects unknown factions, so the fallback only applies outside the faction routes.
  return {
    faction: isFaction(params.faction) ? params.faction : FACTION.REBELS,
    format: isFormat(format) ? format : DEFAULT_FORMAT,
    lang: params.lang || DEFAULT_LANG,
  };
}
