import { SearchableSelect } from '@/components/common/SearchableSelect';
import { useShipUpgradesForm } from '@/hooks/useShipUpgradesForm';

import { StandardLoadoutUpgrades } from './StandardLoadoutUpgrades';
import { UpgradeSelect } from './UpgradeSelect';

import classes from './ShipForm.module.scss';

type ShipUpgradesFormProps = {
  shipId: string;
};

export function ShipUpgradesForm({ shipId }: ShipUpgradesFormProps) {
  const { slots, standardLoadout } = useShipUpgradesForm({ shipId });

  if (standardLoadout.length > 0) {
    return <StandardLoadoutUpgrades upgrades={standardLoadout} />;
  }

  if (slots.length === 0) {
    return null;
  }

  return (
    <div className={classes.upgradeGroup}>
      {slots.map((slot) =>
        slot.claimedBy ? (
          <SearchableSelect
            className={classes.upgradeSelect}
            disabled
            key={slot.id}
            placeholder={`${slot.type} (used by ${slot.claimedBy})`}
          />
        ) : (
          <UpgradeSelect key={slot.id} shipId={shipId} slotId={slot.id} slotType={slot.type} />
        )
      )}
    </div>
  );
}
