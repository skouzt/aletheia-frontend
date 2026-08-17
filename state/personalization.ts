/**
 * Personalization preferences — shape, defaults, and the local draft cache.
 *
 * The server is the source of truth (it feeds Lily's system prompt). AsyncStorage
 * holds a mirror so two things work: Settings can show the current tone without a
 * network round-trip, and an edit is never lost if the screen is dismissed before
 * the save tick is tapped.
 *
 * `dirty` is what distinguishes those two uses. A clean cache is just a copy of the
 * server; a dirty one is unsaved work that must win over whatever the server says.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Keyed by user id, matching the profile and onboarding caches. A single shared
// key leaks across accounts on one device: the next person to sign in would see
// the previous user's tone in Settings, and — worse — the Personalization screen
// would load their unsaved draft and offer to save it to the new account.
const KEY = (userId: string) => `lily.personalization.v2.${userId}`;

export const TONES = ['Gentle', 'Friendly', 'Reflective', 'Direct'] as const;
export type Tone = (typeof TONES)[number];

export const TRAIT_LEVELS = ['Less', 'Default', 'More'] as const;
export type TraitLevel = (typeof TRAIT_LEVELS)[number];

export const TRAITS = [
  { key: 'warm', label: 'Warm' },
  { key: 'encouraging', label: 'Encouraging' },
  { key: 'questions', label: 'Asks questions' },
  { key: 'brevity', label: 'Brevity' },
] as const;

export type TraitKey = (typeof TRAITS)[number]['key'];

export interface Personalization {
  tone: Tone;
  traits: Record<TraitKey, TraitLevel>;
  check_ins: boolean;
  note: string;
}

export const DEFAULT_PERSONALIZATION: Personalization = {
  tone: 'Gentle',
  traits: {
    warm: 'Default',
    encouraging: 'Default',
    questions: 'Default',
    brevity: 'Default',
  },
  check_ins: true,
  note: '',
};

export interface CachedPersonalization {
  value: Personalization;
  /** True when this holds edits the server has not accepted yet. */
  dirty: boolean;
}

/** Next value in a cycling control — what tapping a row does. */
export function cycle<T>(options: readonly T[], current: T): T {
  const i = options.indexOf(current);
  return options[(i + 1) % options.length];
}

/** Coerce anything stored or fetched into a complete, valid object. */
export function normalise(raw: Partial<Personalization> | null | undefined): Personalization {
  const r = raw ?? {};
  return {
    tone: TONES.includes(r.tone as Tone) ? (r.tone as Tone) : DEFAULT_PERSONALIZATION.tone,
    // Merged over defaults so a payload from an older build cannot leave a row
    // rendering "undefined".
    traits: { ...DEFAULT_PERSONALIZATION.traits, ...(r.traits ?? {}) },
    check_ins: r.check_ins ?? DEFAULT_PERSONALIZATION.check_ins,
    note: typeof r.note === 'string' ? r.note : '',
  };
}

export async function loadCache(userId: string): Promise<CachedPersonalization | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<CachedPersonalization>;
    return { value: normalise(saved.value), dirty: saved.dirty === true };
  } catch {
    return null;
  }
}

export async function saveCache(
  userId: string,
  value: Personalization,
  dirty: boolean,
): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(KEY(userId), JSON.stringify({ value, dirty }));
  } catch {
    // A failed cache write must never interrupt an edit; the value is still
    // correct in memory and re-writes on the next change.
  }
}

/** Drop a user's cached preferences — call on sign-out. */
export async function clearCache(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(KEY(userId));
  } catch {
    // Nothing useful to do; the per-user key already prevents cross-account reads.
  }
}
