import { schema } from 'normalizr';

export const platformSchema = new schema.Entity('platform');
export const pilotSchema = new schema.Entity('pilot');
export const upgradeSchema = new schema.Entity('upgrade');

export const platformsSchema = [platformSchema];
export const pilotsSchema = [pilotSchema];
export const upgradesSchema = [upgradeSchema];
