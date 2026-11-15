import { createClient } from '@connectrpc/connect';

import { PointsService } from '@/gen/xwa/points/v1/points_pb';

import { transport } from './transport';

export const pointsServiceClient = createClient(PointsService, transport);
