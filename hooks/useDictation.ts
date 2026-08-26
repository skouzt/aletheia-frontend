import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { makeMutable, type SharedValue } from 'react-native-reanimated';

/**
 * Dictation for the composer: record on device, transcribe with Deepgram.
 *
 * This used to try the platform recogniser first and fall back to the server only
 * when it came back empty. That hybrid was cheap but unreliable — the on-device
 * recogniser is missing on plenty of Android builds, mishears more often, and its
 * failures were silent enough that a take could be lost entirely. One path means
 * one set of failure modes, and the same quality for everyone.
 *
 * The transcript always lands in the input box for review. It is never sent
 * automatically: a misheard sentence posted to Lily unread would be worse than no
 * dictation at all.
 */

/** Hard ceiling on one take — and the thing that bounds the per-minute cost. */
const MAX_SECONDS = 60;

/** How many bars the waveform draws. */
export const LEVEL_COUNT = 44;

/** Metering ticks per second; also the waveform's scroll speed. */
const METER_INTERVAL_MS = 70;

/**
 * Metering is dBFS: 0 is clipping, -160 is silence. Speech lives in the top ~50dB,
 * so anything quieter than the floor is flattened rather than drawn as noise.
 */
const DB_FLOOR = -50;

function levelFromMetering(db: number | undefined): number {
  if (db == null || !Number.isFinite(db)) return 0;
  const norm = (db - DB_FLOOR) / -DB_FLOOR;
  return Math.min(1, Math.max(0, norm));
}

export type DictationState = 'idle' | 'listening' | 'transcribing';

export interface Dictation {
  state: DictationState;
  listening: boolean;
  /**
   * Input levels, newest last, each 0–1. A shared value so the waveform animates on
   * the UI thread — pushing 14 updates a second through React state would re-render
   * the whole chat screen instead.
   */
  levels: SharedValue<number[]>;
  /** Begin a take. */
  start: () => void;
  /** Stop and transcribe what was said. */
  finish: () => void;
  /** Stop and throw the take away. */
  cancel: () => void;
}

export function useDictation(
  onTranscript: (text: string) => void,
  getToken: (opts: { template: string }) => Promise<string | null>,
): Dictation {
  const [state, setState] = useState<DictationState>('idle');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Guards the window between "stop requested" and the recorder actually unloading,
  // so a double tap can't upload the same take twice.
  const stoppingRef = useRef(false);

  // makeMutable rather than useSharedValue: the array identity must survive across
  // renders and be writable from the recording callback.
  const levelsRef = useRef<SharedValue<number[]> | null>(null);
  if (levelsRef.current === null) {
    levelsRef.current = makeMutable<number[]>(new Array(LEVEL_COUNT).fill(0));
  }
  const levels = levelsRef.current;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const resetLevels = useCallback(() => {
    levels.value = new Array(LEVEL_COUNT).fill(0);
  }, [levels]);

  /** Stop the recorder and hand back the file, or null if there is nothing usable. */
  const stopRecorder = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      return rec.getURI();
    } catch {
      return null;
    } finally {
      // Leaving the session in record mode routes later playback to the earpiece.
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      } catch {
        // Best effort — nothing here is worth surfacing to the user.
      }
    }
  }, []);

  const discard = useCallback((uri: string | null) => {
    if (!uri) return;
    try {
      new File(uri).delete();
    } catch {
      // A stranded temp file is not worth an alert.
    }
  }, []);

  const transcribe = useCallback(
    async (uri: string) => {
      setState('transcribing');
      try {
        const token = await getToken({ template: 'backend-api' });
        if (!token) throw new Error('no token');

        const form = new FormData();
        form.append('audio', {
          uri,
          name: 'dictation.m4a',
          type: 'audio/m4a',
        } as unknown as Blob);

        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/chat/transcribe`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: form,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { text?: string } = await res.json();

        if (data.text?.trim()) {
          onTranscript(data.text.trim());
        } else {
          Alert.alert("Didn't catch that", 'Try again, or type instead.');
        }
      } catch {
        // Silent about the mechanism — the user asked to talk, not to hear about
        // which recogniser was used.
        Alert.alert("Couldn't hear that", 'Try again, or type instead.');
      } finally {
        discard(uri);
        setState('idle');
      }
    },
    [discard, getToken, onTranscript],
  );

  const cancel = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    try {
      const uri = await stopRecorder();
      discard(uri);
      resetLevels();
      setState('idle');
    } finally {
      stoppingRef.current = false;
    }
  }, [clearTimer, discard, resetLevels, stopRecorder]);

  const finish = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    clearTimer();
    try {
      const uri = await stopRecorder();
      resetLevels();
      if (!uri) {
        setState('idle');
        return;
      }
      await transcribe(uri);
    } finally {
      stoppingRef.current = false;
    }
  }, [clearTimer, resetLevels, stopRecorder, transcribe]);

  // `finish` is rebuilt on every render, so the auto-stop timer has to read the
  // current one rather than capture the version that existed when it was armed.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const start = useCallback(async () => {
    if (state !== 'idle' || recordingRef.current) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone needed',
          'Allow microphone access to dictate a message.',
        );
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      resetLevels();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (!status.isRecording) return;
          const next = levels.value.slice(1);
          next.push(levelFromMetering(status.metering));
          levels.value = next;
        },
        METER_INTERVAL_MS,
      );

      recordingRef.current = recording;
      setState('listening');

      clearTimer();
      timeoutRef.current = setTimeout(() => finishRef.current(), MAX_SECONDS * 1000);
    } catch {
      await stopRecorder();
      resetLevels();
      setState('idle');
      Alert.alert("Couldn't start dictation", 'Try again, or type instead.');
    }
  }, [clearTimer, levels, resetLevels, state, stopRecorder]);

  // Leaving the screen mid-take must not strand the recorder holding the mic.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) {
        rec
          .stopAndUnloadAsync()
          .then(() =>
            Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }),
          )
          .catch(() => {});
      }
    };
  }, []);

  return { state, listening: state === 'listening', levels, start, finish, cancel };
}
