/**
 * Firebase Analytics.
 *
 * Scope is deliberately narrow. This app holds what people say in therapy, and
 * an analytics SDK is a pipe to a third party — so what goes through it is
 * structural only: which step of a flow someone reached, and whether it
 * completed. Never the answers themselves.
 *
 * Specifically never logged:
 *   · anything a user typed — messages, names, the free-text note
 *   · the Safety_Check answer, which is a self-harm disclosure
 *   · any onboarding answer, even bucketed
 *   · error message text, which can carry tokens or personal detail
 *
 * Every call is fire-and-forget and swallows its own failures. Analytics is
 * never a reason for the app to misbehave in front of someone who is
 * struggling.
 */

import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';

export const ONBOARDING_STEPS = [
  'personal',
  'difficulty',
  'duration',
  'impact',
  'coping',
  'support',
  'safety',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Why a submit failed, as a category. The underlying error text never leaves the device. */
export type SubmitFailure = 'auth' | 'network' | 'server' | 'unknown';

function client() {
  return getAnalytics(getApp());
}

// Takes `unknown` rather than a promise: the modular API returns void for some
// calls and a promise for others, and both need the same swallowing.
async function safely(work: () => unknown) {
  try {
    await work();
  } catch {
    // Deliberately silent. A failed metric is not worth a log line, let alone
    // surfacing anything to the user.
  }
}

/**
 * Which onboarding step someone reached.
 *
 * The index travels with the name so a funnel can be ordered in the console
 * without hard-coding this list there too.
 */
export function trackOnboardingStep(step: OnboardingStep) {
  const index = ONBOARDING_STEPS.indexOf(step);
  return safely(() =>
    logEvent(client(), 'onboarding_step_viewed', {
      step,
      step_index: index >= 0 ? index + 1 : 0,
      total_steps: ONBOARDING_STEPS.length,
    }),
  );
}

export function trackOnboardingCompleted() {
  return safely(() => logEvent(client(), 'onboarding_completed', {}));
}

/**
 * A submit that did not save. This is the counterpart to onboarding_completed:
 * the gap between the two is people who tried and could not, as distinct from
 * people who simply stopped.
 */
export function trackOnboardingFailed(reason: SubmitFailure) {
  return safely(() => logEvent(client(), 'onboarding_submit_failed', { reason }));
}

/** The status check giving up after its retries — the state that used to resend people through onboarding. */
export function trackOnboardingCheckUnreachable() {
  return safely(() => logEvent(client(), 'onboarding_check_unreachable', {}));
}

export function trackScreen(screenName: string) {
  return safely(() =>
    logScreenView(client(), { screen_name: screenName, screen_class: screenName }),
  );
}

/** Honours a user turning analytics off. Persisted natively by the SDK. */
export function setAnalyticsEnabled(enabled: boolean) {
  return safely(() => setAnalyticsCollectionEnabled(client(), enabled));
}

/**
 * Classify a thrown error without keeping any of its text.
 *
 * The message is read here and discarded; only the category is ever sent.
 */
export function classifyFailure(err: unknown): SubmitFailure {
  const text = err instanceof Error ? err.message : String(err ?? '');
  if (/\b401\b|\b403\b|not authenticated/i.test(text)) return 'auth';
  if (/\b5\d\d\b/.test(text)) return 'server';
  if (/network|fetch|timeout|connection/i.test(text)) return 'network';
  return 'unknown';
}
