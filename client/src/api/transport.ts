import { createConnectTransport } from '@connectrpc/connect-web';

// The Vite dev server proxies /api to the Go backend.
const API_BASE_URL = '/api';

export const transport = createConnectTransport({ baseUrl: API_BASE_URL });
