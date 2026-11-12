import { SearchableSelect } from '@/components/common/SearchableSelect';
import type { Upgrade } from '@/gen/xwa/cards/v1/cards_pb';

import classes from './ShipForm.module.scss';

type StandardLoadoutUpgradesProps = {
  upgrades: Upgrade[];
};

/** A standard loadout pilot's fixed upgrades, shown but not changeable. */
export function StandardLoadoutUpgrades({ upgrades }: StandardLoadoutUpgradesProps) {
  return (
    <div className={classes.upgradeGroup}>
      {upgrades.map((upgrade) => (
        <SearchableSelect
          className={classes.upgradeSelect}
          disabled
          key={upgrade.xws}
          options={[{ label: upgrade.name, value: upgrade.xws }]}
          value={upgrade.xws}
        />
      ))}
    </div>
  );
}
