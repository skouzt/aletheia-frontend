/**
 * Read-side access to the user's Personalization preferences.
 *
 * Local-first. These only change when the user changes them in this app, so there
 * is nothing to poll for: the device copy is authoritative for reads, and the
 * network is touched only when something actually changes.
 *
 *   read   -> memory, else AsyncStorage, else one hydrating GET
 *   write  -> PUT (in the Personalization screen), then publishPersonalization()
 *
 * The one GET is not optional. Without it a reinstall or a second device would
 * show defaults while the server holds the real preferences — and the next save
 * would push those defaults over them. So we fetch exactly once, when this device
 * has no copy of its own, and never again.
 *
 * The Personalization screen does not use this hook; it owns editing, dirty state
 * and the save tick. This is for everywhere that only needs to display the values.
 */

import { fetchPersonalization } from '@/services/personalization';
import {
  DEFAULT_PERSONALIZATION,
  Personalization,
  loadCache,
  normalise,
  saveCache,
} from '@/state/personalization';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

type Listener = (value: Personalization) => void;

let cache: Personalization = DEFAULT_PERSONALIZATION;
let cachedUserId: string | null = null;
let listeners = new Set<Listener>();
let inFlight: Promise<void> | null = null;
/** True once this user's value is in memory, from any source. No TTL — see above. */
let hydrated = false;

function emit() {
  for (const listener of listeners) listener(cache);
}

function setStore(value: Personalization) {
  cache = value;
  emit();
}

/** Drop everything when the signed-in user changes, so account B never reads A's. */
function resetFor(userId: string | null) {
  cachedUserId = userId;
  hydrated = false;
  inFlight = null;
  cache = DEFAULT_PERSONALIZATION;
}

/**
 * Publish a value the user just saved. Called by the Personalization screen after
 * its PUT succeeds — this is what keeps every other screen current without anyone
 * re-reading the endpoint.
 */
export function publishPersonalization(value: Personalization) {
  hydrated = true;
  setStore(value);
}

async function hydrate(
  getToken: (opts: { template: string }) => Promise<string | null>,
  userId: string | null,
  force: boolean,
): Promise<void> {
  if (!userId) {
    setStore(DEFAULT_PERSONALIZATION);
    return;
  }
  if (hydrated && !force) return;
  // Concurrent mounts await the same work rather than each doing it.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const cached = await loadCache(userId);
      if (cached) {
        // This device already knows the answer. No request.
        setStore(cached.value);
        hydrated = true;
        if (!force) return;
      }

      const server = normalise(await fetchPersonalization(getToken));
      setStore(server);
      hydrated = true;
      // Never overwrite unsaved edits — the screen still needs them.
      if (!cached?.dirty) void saveCache(userId, server, false);
    } catch {
      // Offline with no local copy: defaults stand and `hydrated` stays false, so
      // the next mount tries again rather than caching a wrong answer forever.
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function usePersonalization() {
  const { getToken, userId } = useAuth();

  // getToken has a new identity every render; a ref keeps it out of dep arrays.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [value, setValue] = useState<Personalization>(cache);

  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  useEffect(() => {
    const uid = userId ?? null;
    if (cachedUserId !== uid) {
      resetFor(uid);
      setValue(cache);
    }
    void hydrate(getTokenRef.current, uid, false);
  }, [userId]);

  /** Force a re-read from the server. Nothing calls this on a schedule. */
  const refresh = useCallback(
    () => hydrate(getTokenRef.current, userId ?? null, true),
    [userId],
  );

  return { personalization: value, refresh };
}
