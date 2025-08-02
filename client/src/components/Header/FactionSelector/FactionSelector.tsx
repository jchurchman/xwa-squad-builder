import classNames from 'classnames';
import { NavLink, useParams } from 'react-router';

import { FactionIcon } from '@components';
import { useAppDispatch } from '@hooks';
import { newList } from 'src/state/slices/listSlice';

import classes from './FactionSelector.module.scss';

import { Faction } from '@shared/types';

const selectorButtonOrder: Faction[] = [
  Faction.rebels,
  Faction.empire,
  Faction.scum,
  Faction.resistance,
  Faction.firstorder,
  Faction.republic,
  Faction.separatists,
];

export function FactionSelector() {
  const { lang } = useParams();
  const dispatch = useAppDispatch();

  return (
    <div className={classes.selectorContainer}>
      {selectorButtonOrder.map((faction, idx) => (
        <NavLink
          className={({ isActive }) => classNames(classes.navLink, { [classes.active]: isActive })}
          key={idx}
          onClick={() => dispatch(newList())}
          to={`/${lang}/${faction}`}
        >
          {({ isActive }) => (
            <FactionIcon active={isActive} className={classes.navLink} faction={faction} />
          )}
        </NavLink>
      ))}
    </div>
  );
}
