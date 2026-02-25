import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const CACHE_KEY = (userId: string) => `onboarding_status_${userId}`;

export function useCheckOnboarding() {
  const { userId, isLoaded, isSignedIn, getToken } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !userId) {
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkUser = async () => {
      try {
        setIsLoading(true);

        const cached = await AsyncStorage.getItem(CACHE_KEY(userId));
        if (cached !== null) {
          if (!cancelled) {
            setHasCompletedOnboarding(JSON.parse(cached));
            setIsLoading(false);
          }
          return;
        }

        const token = await getToken({ template: "backend-api" });
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/onboarding-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const { completed } = await response.json();

        if (!cancelled) {
          setHasCompletedOnboarding(completed);
          await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(completed));
        }
      } catch (err) {
        console.error("Onboarding check failed:", err);
        if (!cancelled) setHasCompletedOnboarding(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkUser();

    return () => { cancelled = true; };
  }, [userId, isLoaded, isSignedIn]);

  return { hasCompletedOnboarding, isLoading };
}

export const markOnboardingComplete = async (userId: string) => {
  await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(true));
};

export const clearOnboardingCache = async (userId: string) => {
  await AsyncStorage.removeItem(CACHE_KEY(userId));
};