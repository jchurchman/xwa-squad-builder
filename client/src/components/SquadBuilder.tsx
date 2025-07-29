import { useParams } from 'react-router';

import { ListForm } from './ListForm';

export function SquadBuilder() {
  const { faction, lang } = useParams();

  return (
    <div>
      <div>
        Squad Builder for {faction} in {lang}
      </div>
      <ListForm />
    </div>
  );
}
