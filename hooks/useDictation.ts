import { Audio } from 'expo-av';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Dictation for the composer: on-device first, cloud only as a fallback.
 *
 * The platform recogniser handles the common case — free, offline, and the audio
 * never leaves the phone. We record in parallel purely so that, if it comes back
 * with nothing, the same take can be sent to the server rather than being lost.
 *
 * That ordering is what keeps voice affordable. Deepgram bills ~$0.0077/min, which
 * on every take would put the ₹999/year plan underwater at ten voice notes a day.
 * Paying only for the failures keeps it near zero.
 *
 * The transcript always lands in the input box for review. It is never sent
 * automatically: a misheard sentence posted to Lily unread would be worse than no
 * dictation at all.
 */

/** Hard ceiling on one take — and the thing that bounds the fallback's per-minute cost. */
const MAX_SECONDS = 60;

export type DictationState = 'idle' | 'listening' | 'transcribing';

export interface Dictation {
  state: DictationState;
  listening: boolean;
  toggle: () => void;
  stop: () => void;
}

export function useDictation(
  onTranscript: (text: string) => void,
  getToken: (opts: { template: string }) => Promise<string | null>,
): Dictation {
  const [state, setState] = useState<DictationState>('idle');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Set as soon as the device produces any text, so `end` knows whether to fall back.
  const gotResultRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Stop and discard the parallel recording. Used when the device path succeeded. */
  const discardRecording = useCallback(async () => {
    const rec = recordingRef.current;
    recordingRef.current = null;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      return rec.getURI();
    } catch {
      return null;
    }
  }, []);

  const runFallback = useCallback(async () => {
    const uri = await discardRecording();
    if (!uri) {
      setState('idle');
      return;
    }

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
      setState('idle');
    }
  }, [discardRecording, getToken, onTranscript]);

  useSpeechRecognitionEvent('start', () => setState('listening'));

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript;
    if (text?.trim()) {
      gotResultRef.current = true;
      onTranscript(text);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    clearTimer();
    if (gotResultRef.current) {
      // Device handled it — throw the audio away without uploading anything.
      discardRecording();
      setState('idle');
    } else {
      runFallback();
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    clearTimer();

    if (event.error === 'not-allowed') {
      discardRecording();
      setState('idle');
      Alert.alert(
        'Microphone needed',
        'Allow microphone and speech recognition access to dictate a message.',
      );
      return;
    }

    // Everything else — recogniser missing, no match, network — is exactly what the
    // fallback exists for, provided they actually said something.
    if (!gotResultRef.current) {
      runFallback();
    } else {
      discardRecording();
      setState('idle');
    }
  });

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    clearTimer();
  }, [clearTimer]);

  const toggle = useCallback(async () => {
    if (state === 'transcribing') return;
    if (state === 'listening') {
      stop();
      return;
    }

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Microphone needed',
          'Allow microphone and speech recognition access to dictate a message.',
        );
        return;
      }

      gotResultRef.current = false;

      // Record alongside recognition. The platform recogniser does not hand back the
      // audio, so without this a failed take could not be retried in the cloud.
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        recordingRef.current = recording;
      } catch {
        // No recording means no fallback, but on-device can still work on its own.
        recordingRef.current = null;
      }

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });

      clearTimer();
      timeoutRef.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch {
      discardRecording();
      setState('idle');
      Alert.alert("Couldn't start dictation", 'Try again, or type instead.');
    }
  }, [state, stop, clearTimer, discardRecording]);

  return { state, listening: state === 'listening', toggle, stop };
}
