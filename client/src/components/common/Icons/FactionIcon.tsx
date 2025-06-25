import classNames from "classnames";

import classes from "./Icons.module.scss"
import { Faction } from "src/types";

type IconProps = {
  className?: string;
  styles?: unknown;
  active?: boolean;
  faction: Faction;
}

const factionToFactionClassMap: Record<Faction, string> = {
  [Faction.rebels]: "rebel",
  [Faction.empire]: "empire",
  [Faction.scum]: "scum",
  [Faction.firstorder]: "firstorder",
  [Faction.republic]: "republic",
  [Faction.separatists]: "separatists",
  [Faction.resistance]: "rebel-outline",
}

export function FactionIcon(props: IconProps) {
  const { className, active, faction } = props;

  return (
    <i
      className={
        classNames(
          'xwing-miniatures-font',
          classes.factionIcon,
          classes[factionToFactionClassMap[faction]],
          `xwing-miniatures-font-${factionToFactionClassMap[faction]}`,
          { [classes.active]: active },
          className,
        )
      }
    />
  );
}

