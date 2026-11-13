import classNames from 'classnames';
import { NavLink, useParams } from 'react-router';

import { FactionIcon } from '@/components/common/Icons/FactionIcon';
import { FACTION } from '@/constants';
import { useAppDispatch } from '@/hooks/state';
import { newList } from '@/state/slices/listSlice';

import classes from './FactionSelector.module.scss';

import type { Faction } from '@/types/faction';

const SELECTOR_ORDER: Faction[] = [
  FACTION.REBELS,
  FACTION.EMPIRE,
  FACTION.SCUM,
  FACTION.RESISTANCE,
  FACTION.FIRST_ORDER,
  FACTION.REPUBLIC,
  FACTION.SEPARATISTS,
];

export function FactionSelector() {
  const { lang } = useParams();
  const dispatch = useAppDispatch();

  return (
    <div className={classes.selectorContainer}>
      {SELECTOR_ORDER.map((faction, idx) => (
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
