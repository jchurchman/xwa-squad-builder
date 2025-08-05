import { useShipUpgradesForm } from '@hooks';

import { UpgradeSelector } from './UpgradeSelector';

import classes from './ShipForm.module.scss';

type ShipUpgradesFormProps = {
  shipId: string;
};

export function ShipUpgradesForm({ shipId }: ShipUpgradesFormProps) {
  const { upgradeSlotMetadata } = useShipUpgradesForm({ shipId });

  if (!upgradeSlotMetadata.length) {
    return null;
  }

  return (
    <div className={classes.upgradeGroup}>
      {upgradeSlotMetadata.map(([slotId, slotType]) => (
        <UpgradeSelector
          key={`${shipId}.${slotId}`}
          shipId={shipId}
          slotId={slotId}
          slotType={slotType}
        />
      ))}
    </div>
  );
}
