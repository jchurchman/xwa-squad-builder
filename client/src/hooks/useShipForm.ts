import { usePilotSelect } from './usePilotSelect';
import { usePlatformSelect } from './usePlatformSelect';
import { useShipLoadout } from './useShipLoadout';

export function useShipForm({ shipId }: { shipId: string }) {
  const platform = usePlatformSelect({ shipId });
  const pilot = usePilotSelect({ shipId });
  const loadout = useShipLoadout({ shipId });

  return {
    loadout,
    pilot,
    platform,
  };
}
