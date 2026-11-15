import { createClient } from '@connectrpc/connect';

import { CardService } from '@/gen/xwa/cards/v1/cards_pb';

import { transport } from './transport';

export const cardServiceClient = createClient(CardService, transport);
