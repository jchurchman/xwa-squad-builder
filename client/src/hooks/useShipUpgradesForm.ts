import { useMemo } from 'react';

import type { Upgrade } from '@/gen/xwa/cards/v1/cards_pb';
import { getClaimedSlots, getShipSlots, type ShipSlot } from '@/rules/upgradeRules';

import { useSquad } from './useSquad';

export interface UpgradeSlotDisplay extends ShipSlot {
  /** Name of the upgrade in another slot that also occupies this one. */
  claimedBy?: string;
}

const NO_SLOTS: UpgradeSlotDisplay[] = [];
const NO_UPGRADES: Upgrade[] = [];

/** The slots to show for a ship, or its fixed upgrades if the pilot has a standard loadout. */
export function useShipUpgradesForm({ shipId }: { shipId: string }) {
  const { squad } = useSquad();
  const squadShip = squad.find((s) => s.id === shipId);

  return useMemo(() => {
    if (!squadShip) {
      return { slots: NO_SLOTS, standardLoadout: NO_UPGRADES };
    }
    if (squadShip.pilot.standardLoadout.length > 0) {
      return { slots: NO_SLOTS, standardLoadout: Object.values(squadShip.upgrades) };
    }

    const slots = getShipSlots(squadShip.pilot);
    const claimed = getClaimedSlots(slots, squadShip.upgrades);
    return {
      slots: slots.map((slot) => ({
        ...slot,
        claimedBy: claimed[slot.id] ? squadShip.upgrades[claimed[slot.id]]?.name : undefined,
      })),
      standardLoadout: NO_UPGRADES,
    };
  }, [squadShip]);
}
