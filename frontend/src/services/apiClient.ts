const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');

type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;
  token?: string | null;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json() as { detail?: unknown; message?: unknown };
      if (typeof body.detail === 'string') message = body.detail;
      else if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item: { msg?: string }) => item.msg)
          .filter(Boolean)
          .join(', ') || message;
      }
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function jsonBody(body: unknown): Pick<RequestInit, 'headers' | 'body'> {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
