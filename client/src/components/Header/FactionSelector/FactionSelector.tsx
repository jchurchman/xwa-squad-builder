import { NavLink, useParams } from "react-router";

import {
  FactionIcon,
} from '@components';

import classes from './FactionSelector.module.scss';

import { Faction } from "@types";
import classNames from "classnames";

const selectorButtonOrder: Faction[] = [
  Faction.rebels,
  Faction.empire,
  Faction.scum,
  Faction.resistance,
  Faction.firstorder,
  Faction.republic,
  Faction.separatists
]

export function FactionSelector() {
  const { lang } = useParams();
  return (
    <div className={classes.selectorContainer}>
      {
        selectorButtonOrder.map((faction, idx) => (
          <NavLink
            to={`/${lang}/${faction}`}
            key={idx}
            className={({ isActive }) => classNames(classes.navLink, { [classes.active]: isActive })}
          >
            {({ isActive }) => (
              <FactionIcon
                className={classes.navLink}
                faction={faction}
                active={isActive}
              />
            )}
          </NavLink>
        ))
      }
    </div>
  );
}
