import { useParams } from 'react-router';

import { ListForm } from './ListForm';

export function SquadBuilder() {
  const { faction, lang } = useParams();

  // Your component logic here
  return (
    <div>
      <div>
        Squad Builder for {faction} in {lang}
      </div>
      <ListForm />
    </div>
  );
}
