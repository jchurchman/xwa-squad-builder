import { useUpgradeSelect } from '@hooks';

import { UpgradeSelector } from './UpgradeSelector';

import { UpgradeId } from '@shared/types';

type ShipUpgradesFormProps = {
  shipId: string;
};

export function ShipUpgradesForm({ shipId }: ShipUpgradesFormProps) {
  const { onClear, onSelect, upgradeSlotProps } = useUpgradeSelect({ shipId });

  if (!upgradeSlotProps.length) {
    return null;
  }

  return upgradeSlotProps.map((slotProps) => (
    <UpgradeSelector
      key={slotProps.slotId}
      onClear={() => onClear(slotProps.slotId)}
      onSelect={(upgradeId: UpgradeId) => onSelect(slotProps.slotId, upgradeId)}
      options={slotProps.options}
      selected={slotProps.selected}
      slotType={slotProps.slotType}
    />
  ));
}
