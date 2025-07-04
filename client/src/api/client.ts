class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, { body: JSON.stringify(data), method: 'POST' }),
  put: <T>(endpoint: string, data?: unknown) =>
    apiRequest<T>(endpoint, { body: JSON.stringify(data), method: 'PUT' }),
};

export { ApiError };
