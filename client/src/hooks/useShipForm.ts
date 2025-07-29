import { usePilotSelect } from './usePilotSelect';
import { usePlatformSelect } from './usePlatformSelect';

export function useShipForm({ shipId }: { shipId: string }) {
  const platform = usePlatformSelect({ shipId });
  const pilot = usePilotSelect({ shipId });

  return {
    pilot,
    platform,
  };
}
