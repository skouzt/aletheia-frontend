import { Stack, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ONBOARDING_STEPS, OnboardingStep, trackOnboardingStep } from '@/services/analytics';

/**
 * Records how far into onboarding people get.
 *
 * Done from the layout rather than in each of the seven screens: the route is
 * already the step name, so one listener here cannot drift out of sync with the
 * flow the way seven scattered calls would.
 */
export default function FormLayout() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    const step = pathname.split('/').pop() ?? '';
    if (!(ONBOARDING_STEPS as readonly string[]).includes(step)) return;

    // Re-renders and back-navigation would otherwise report the same step
    // repeatedly and inflate every stage of the funnel.
    if (lastLogged.current === step) return;
    lastLogged.current = step;

    trackOnboardingStep(step as OnboardingStep);
  }, [pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
