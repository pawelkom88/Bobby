import { NextRequest } from 'next/server';

type RequestInitOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

export function createJsonRequest(
  url: string,
  { method = 'POST', headers = {}, body }: RequestInitOptions = {}
) {
  const requestInit: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  return new NextRequest(url, requestInit);
}

export function createTextRequest(
  url: string,
  { method = 'POST', headers = {}, body = '' }: RequestInitOptions = {}
) {
  return new NextRequest(url, {
    method,
    headers,
    body: typeof body === 'string' ? body : String(body),
  });
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}
