import classNames from 'classnames';

import { Faction } from 'src/types';

import classes from './Icons.module.scss';

type IconProps = {
  active?: boolean;
  className?: string;
  faction: Faction;
  styles?: unknown;
};

const factionToFactionClassMap: Record<Faction, string> = {
  [Faction.empire]: 'empire',
  [Faction.firstorder]: 'firstorder',
  [Faction.rebels]: 'rebel',
  [Faction.republic]: 'republic',
  [Faction.resistance]: 'rebel-outline',
  [Faction.scum]: 'scum',
  [Faction.separatists]: 'separatists',
};

export function FactionIcon(props: IconProps) {
  const { active, className, faction } = props;

  return (
    <i
      className={classNames(
        'xwing-miniatures-font',
        classes.factionIcon,
        classes[factionToFactionClassMap[faction]],
        `xwing-miniatures-font-${factionToFactionClassMap[faction]}`,
        { [classes.active]: active },
        className
      )}
    />
  );
}
