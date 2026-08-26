import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The three intro screens are a first-launch-only welcome, so the flag is
 * device-local — it deliberately survives sign-out and is not tied to a user id.
 */
const INTRO_SEEN_KEY = 'lily_intro_seen';

export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INTRO_SEEN_KEY)) === 'true';
  } catch {
    // A storage failure shouldn't trap someone on the intro — treat it as seen.
    return true;
  }
}

export async function markIntroSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
  } catch {
    // Non-fatal: worst case the intro shows again next launch.
  }
}
