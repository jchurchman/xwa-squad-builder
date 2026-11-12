import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';

import { CardService } from '@/gen/xwa/cards/v1/cards_pb';

// The Vite dev server proxies /api to the Go backend.
const API_BASE_URL = '/api';

export const cardServiceClient = createClient(
  CardService,
  createConnectTransport({ baseUrl: API_BASE_URL })
);
