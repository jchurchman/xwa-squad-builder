import { schema } from 'normalizr';

export const shipSchema = new schema.Entity('ships');
export const pilotSchema = new schema.Entity('pilots');
export const upgradeSchema = new schema.Entity('upgrades');

export const shipsSchema = [shipSchema];
export const pilotsSchema = [pilotSchema];
export const upgradesSchema = [upgradeSchema];
