import { slugify } from '@shared/utils';
import classNames from 'classnames';

import classes from './Icons.module.scss';

import { Faction } from '@shared/types';

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
