import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const CACHE_KEY = (userId: string) => `onboarding_status_${userId}`;

const ATTEMPTS = 3;
const BACKOFF_MS = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Whether this user has finished onboarding.
 *
 * Three states, and the third is the point: `true`, `false`, and "we could not
 * find out". This used to collapse a failed request into `false`, which sent
 * people who had already onboarded back through the whole form — a network
 * blip, a cold backend, or a Clerk outage (the API answers 503 for that) all
 * landed there. Anyone whose cache had been cleared by a reinstall or a new
 * phone got the form again, and submitted a second time.
 *
 * Now a failure is retried, and if it still will not answer the caller is told
 * so and can offer a retry, rather than being guessed at in either direction.
 * Guessing `true` would strand a genuinely new user in an empty app; guessing
 * `false` is the bug this replaces.
 */
export function useCheckOnboarding() {
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** Ask again after a failure. Wired to the retry button on the splash. */
  const retry = useCallback(() => {
    setUnreachable(false);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setHasCompletedOnboarding(false);
      setUnreachable(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkUser = async () => {
      setIsLoading(true);
      setUnreachable(false);

      // A cached completion is authoritative and needs no network: onboarding
      // is not something a user can become un-done from.
      const cached = await AsyncStorage.getItem(CACHE_KEY(userId));
      if (cached !== null && JSON.parse(cached) === true) {
        if (!cancelled) {
          setHasCompletedOnboarding(true);
          setIsLoading(false);
        }
        return;
      }

      let lastError: unknown = null;

      for (let i = 0; i < ATTEMPTS; i++) {
        if (cancelled) return;
        try {
          const token = await getToken({ template: 'backend-api' });
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/onboarding-status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
            },
          );

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const { completed } = await response.json();
          if (cancelled) return;

          // Only a `true` is worth caching. Caching `false` would pin someone
          // to the pre-onboarding answer until something else overwrote it.
          if (completed) {
            await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(true));
          }

          setHasCompletedOnboarding(Boolean(completed));
          setIsLoading(false);
          return;
        } catch (err) {
          lastError = err;
          // Fresh token and a new attempt; the common causes here (cold start,
          // dropped connection, brief 5xx) clear on their own within seconds.
          if (i < ATTEMPTS - 1) await sleep(BACKOFF_MS * 2 ** i);
        }
      }

      if (cancelled) return;
      console.error('Onboarding check failed after retries:', lastError);
      setHasCompletedOnboarding(null);
      setUnreachable(true);
      setIsLoading(false);
    };

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [userId, isLoaded, isSignedIn, attempt]);

  return { hasCompletedOnboarding, isLoading, unreachable, retry };
}

export const markOnboardingComplete = async (userId: string) => {
  await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(true));
};

export const clearOnboardingCache = async (userId: string) => {
  await AsyncStorage.removeItem(CACHE_KEY(userId));
};
