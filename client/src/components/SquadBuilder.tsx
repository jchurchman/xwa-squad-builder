import { useTypedParams } from '@/hooks/useTypedParams';
import { FACTION_NAMES } from '@/strings/factionNames';

import { ListForm } from './ListForm/ListForm';

export function SquadBuilder() {
  const { faction, lang } = useTypedParams();

  return (
    <div>
      <div>
        Squad Builder for {FACTION_NAMES[faction]} in {lang}
      </div>
      <ListForm />
    </div>
  );
}
