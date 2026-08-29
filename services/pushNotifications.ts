/**
 * Push registration.
 *
 *   POST   /api/v1/notifications/token        register this device
 *   DELETE /api/v1/notifications/token        forget it (sign-out)
 *   GET    /api/v1/notifications/preferences  { enabled, devices }
 *   PUT    /api/v1/notifications/preferences  the Settings toggle
 *
 * A push token addresses one app install on one device. It changes on
 * reinstall, so registration runs on every launch rather than once — the
 * backend upserts, so repeating it is free.
 */

import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type TokenGetter = (opts: { template: string }) => Promise<string | null>;

const BASE = process.env.EXPO_PUBLIC_API_URL;

export interface NotificationPreferences {
  enabled: boolean;
  /** How many devices this account has registered. Zero means nothing can arrive. */
  devices: number;
}

async function authHeaders(getToken: TokenGetter) {
  const token = await getToken({ template: 'backend-api' });
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function readToken(): Promise<string | null> {
  // The EAS project id ties the token to this app; without it Expo cannot route
  // a send back to the right project.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return data ?? null;
  } catch {
    // A simulator, missing FCM credentials, no network, or a build without the
    // native module — all end here, and none should surface to the user.
    return null;
  }
}

/**
 * This device's push address, asking the OS for permission if it has not been
 * asked yet. Only for moments where a prompt is expected: enabling the toggle,
 * or the first launch after signing in.
 */
export async function getPushToken(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  // Only prompt if the OS has not already answered. Asking again after a
  // refusal does nothing on iOS and is a second dialog on Android.
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  return readToken();
}

/**
 * The token only if permission was already granted — never prompts.
 *
 * Used on sign-out, where asking someone to allow notifications on their way
 * out of the app would be absurd. Someone who never enabled them simply has no
 * token to detach.
 */
export async function getExistingPushToken(): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;
  return readToken();
}

export async function registerDevice(getToken: TokenGetter, pushToken: string): Promise<void> {
  await fetch(`${BASE}/api/v1/notifications/token`, {
    method: 'POST',
    headers: await authHeaders(getToken),
    body: JSON.stringify({
      token: pushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    }),
  });
}

/**
 * The token travels as a query parameter, not a body: a request body on DELETE
 * is legal but widely dropped by proxies and CDNs, which would make this fail
 * only in production and only sometimes.
 */
export async function unregisterDevice(getToken: TokenGetter, pushToken: string): Promise<void> {
  const query = `token=${encodeURIComponent(pushToken)}`;
  await fetch(`${BASE}/api/v1/notifications/token?${query}`, {
    method: 'DELETE',
    headers: await authHeaders(getToken),
  });
}

export async function fetchPreferences(getToken: TokenGetter): Promise<NotificationPreferences> {
  const res = await fetch(`${BASE}/api/v1/notifications/preferences`, {
    headers: await authHeaders(getToken),
  });
  if (!res.ok) throw new Error('Failed to read notification preferences');
  return res.json();
}

export async function setPreferences(
  getToken: TokenGetter,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const res = await fetch(`${BASE}/api/v1/notifications/preferences`, {
    method: 'PUT',
    headers: await authHeaders(getToken),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to update notification preferences');
  return res.json();
}

/**
 * Tell the backend which timezone this device is in.
 *
 * Sessions cover one local day, and the reaper closes yesterday's while nobody
 * is online — so the zone has to be stored server-side rather than read from a
 * request. Sent on launch because people travel, and a stale zone would file a
 * conversation under the wrong day.
 */
export async function reportTimezone(getToken: TokenGetter): Promise<void> {
  const timezone = Localization.getCalendars()[0]?.timeZone;
  if (!timezone) return;

  await fetch(`${BASE}/api/v1/users/timezone`, {
    method: 'PUT',
    headers: await authHeaders(getToken),
    body: JSON.stringify({ timezone }),
  });
}
