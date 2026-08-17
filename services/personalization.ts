/**
 * Personalization transport.
 *
 *   GET  /api/v1/users/personalization -> Personalization
 *   PUT  /api/v1/users/personalization    { ... } -> Personalization (normalised)
 *
 * The server normalises whatever it is sent, so the PUT response — not the local
 * object — is what gets cached. If the server drops or corrects a value, the UI
 * should show what was actually stored.
 */

import type { Personalization } from '@/state/personalization';

export type TokenGetter = (opts: { template: string }) => Promise<string | null>;

const BASE = process.env.EXPO_PUBLIC_API_URL;
const PATH = '/api/v1/users/personalization';

async function authHeaders(getToken: TokenGetter) {
  const token = await getToken({ template: 'backend-api' });
  if (!token) throw new Error('not signed in');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fetchPersonalization(getToken: TokenGetter): Promise<Personalization> {
  if (!BASE) throw new Error('EXPO_PUBLIC_API_URL not set');
  const res = await fetch(`${BASE}${PATH}`, {
    headers: await authHeaders(getToken),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Personalization;
}

export async function pushPersonalization(
  getToken: TokenGetter,
  value: Personalization,
): Promise<Personalization> {
  if (!BASE) throw new Error('EXPO_PUBLIC_API_URL not set');
  const res = await fetch(`${BASE}${PATH}`, {
    method: 'PUT',
    headers: await authHeaders(getToken),
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Personalization;
}
