import classNames from 'classnames';

import type { Faction } from '@/constants';
import { slugify } from '@/utils/slugify';

import classes from './Icons.module.scss';

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
        classes[slugify(faction)],
        `xwing-miniatures-font-${slugify(faction)}`,
        { [classes.active]: active },
        className
      )}
    />
  );
}
