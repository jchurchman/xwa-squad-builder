import classNames from 'classnames';

import classes from './Icons.module.scss';

import type { Faction } from '@/types/faction';

type IconProps = {
  active?: boolean;
  className?: string;
  faction: Faction;
  styles?: unknown;
};

export function FactionIcon(props: IconProps) {
  const { active, className, faction } = props;

  return (
    <i
      className={classNames(
        'xwing-miniatures-font',
        classes.factionIcon,
        classes[faction],
        `xwing-miniatures-font-${faction}`,
        { [classes.active]: active },
        className
      )}
    />
  );
}
