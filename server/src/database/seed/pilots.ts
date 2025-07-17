import { Pilot, PlatformOverride } from '../../../../shared/types';
import { notNil } from './common';

type ImportedPilot = {
  applies_condition?: string | string[];
  charge?: number;
  chassis?: string;
  engagement?: number;
  faction: string;
  force?: number;
  forcerecurring?: number;
  id?: number;
  keyword?: string[];
  loadout: number;
  loadoutxwa?: number;
  max_per_squad?: number;
  name: string;
  points: number;
  pointsxwa?: number;
  recurring?: number;
  restriction_func?: () => void;
  restrictions?: string[][];
  ship: string;
  ship_override?: PlatformOverride;
  skill: number;
  skip?: boolean;
  slots: string[];
  slotsxwa?: string[];
  unique?: boolean;
  upgrades?: string[];
  xws?: string;
  xwsaddon?: string;
  xwsship?: boolean;
};

export function transformPilotsForDb(
  rawPilots: ImportedPilot[]
): Omit<Pilot, 'created_at' | 'id'>[] {
  return rawPilots.reduce(
    (transformed, pilot) => {
      const {
        applies_condition,
        charge,
        chassis,
        engagement,
        faction,
        force,
        forcerecurring,
        keyword,
        loadout,
        loadoutxwa,
        max_per_squad,
        name,
        points,
        pointsxwa,
        recurring,
        restrictions,
        ship,
        ship_override,
        skill,
        skip,
        slots,
        slotsxwa,
        unique,
        upgrades,
        xws,
        xwsaddon,
        xwsship,
      } = pilot;

      if (skip) {
        return transformed;
      }

      const newPilot: Omit<Pilot, 'created_at' | 'id'> = {
        ...(notNil(applies_condition) && {
          appliesCondition: Array.isArray(applies_condition)
            ? applies_condition
            : [applies_condition],
        }),
        ...(notNil(charge) && { charge }),
        ...(notNil(chassis) && { chassis }),
        ...(notNil(engagement) && { engagement }),
        faction,
        ...(notNil(force) && { force }),
        ...(notNil(forcerecurring) && { forcerecurring }),
        ...(notNil(keyword) && { keywords: keyword }),
        loadout: notNil(loadoutxwa) ? loadoutxwa : loadout || 0,
        ...((notNil(unique) || notNil(max_per_squad)) && {
          maxPerSquad: unique ? 1 : max_per_squad,
        }),
        name,
        points: notNil(pointsxwa) ? pointsxwa : points,
        ...(notNil(recurring) && { recurring }),
        ...(notNil(restrictions) && {
          restrictions: { upgradesInList: [restrictions[0][1]] },
        }),
        platform: ship,
        ...(notNil(ship_override) && { platformOverride: ship_override }),
        skill,
        slots: notNil(slotsxwa) ? slotsxwa : slots || [],
        ...(notNil(upgrades) && { upgrades }),
        ...(notNil(xws) && { xws }),
        ...(notNil(xwsaddon) && { xwsaddon }),
        ...(notNil(xwsship) && { xwsship }),
      };

      transformed.push(newPilot);

      return transformed;
    },
    [] as Omit<Pilot, 'created_at' | 'id'>[]
  );
}
