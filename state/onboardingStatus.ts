import { create } from 'zustand';

/**
 * Whether this user has finished onboarding, shared across the app.
 *
 * The root navigator gates chat on this, and the submit that satisfies the gate
 * happens in a different part of the tree. With per-component state the guard
 * never heard about it: finishing onboarding left the breathing screen trying
 * to navigate to a route that had been removed, and only a restart recovered.
 *
 * null means "not known yet" — the gate stays closed until it is.
 */
interface OnboardingStatus {
  completed: boolean | null;
  setCompleted: (completed: boolean | null) => void;
}

export const useOnboardingStatus = create<OnboardingStatus>((set) => ({
  completed: null,
  setCompleted: (completed) => set({ completed }),
}));
