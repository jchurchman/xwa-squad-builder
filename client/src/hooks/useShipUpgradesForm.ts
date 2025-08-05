import { selectShipUpgradeSlots } from '@selectors';

import { useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

export function useShipUpgradesForm({ shipId }: { shipId: string }): {
  upgradeSlotMetadata: [string, string][];
} {
  const { faction } = useTypedParams();

  const upgradeSlotMetadata = useAppSelector((state) =>
    selectShipUpgradeSlots(state, { faction, shipId })
  );

  return {
    upgradeSlotMetadata,
  };
}
