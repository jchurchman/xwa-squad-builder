import { useUpgradeSelect } from '@hooks';

import { UpgradeSelector } from './UpgradeSelector';

import classes from './ShipForm.module.scss';

import { UpgradeId } from '@shared/types';

type ShipUpgradesFormProps = {
  shipId: string;
};

export function ShipUpgradesForm({ shipId }: ShipUpgradesFormProps) {
  const { onClear, onSelect, upgradeSlotProps } = useUpgradeSelect({ shipId });

  if (!upgradeSlotProps.length) {
    return null;
  }

  return (
    <div className={classes.upgradeGroup}>
      {upgradeSlotProps.map((slotProps) => (
        <UpgradeSelector
          key={slotProps.slotId}
          onClear={() => onClear(slotProps.slotId)}
          onSelect={(upgradeId: UpgradeId) => onSelect(slotProps.slotId, upgradeId)}
          options={slotProps.options}
          selected={slotProps.selected}
          slotType={slotProps.slotType}
        />
      ))}
    </div>
  );
}
