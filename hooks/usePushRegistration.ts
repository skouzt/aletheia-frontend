/**
 * Registers this device for push once the user is signed in.
 *
 * Runs on every launch rather than once. Expo reissues a token when the install
 * changes — reinstall, restore to a new phone, some OS updates — and a token we
 * never re-sent is an address the backend still believes in but nothing reads.
 * Registration is an upsert, so repeating it costs one request.
 *
 * Deliberately silent. Push is an enhancement; if permission is refused or the
 * network is down, the app carries on and nothing is shown.
 */

import { useAuth } from '@clerk/clerk-expo';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { getPushToken, registerDevice, reportTimezone } from '@/services/pushNotifications';

// Foreground behaviour. Without a handler, a notification arriving while the
// app is open is delivered to code but never shown — which reads as "push is
// broken" during testing, when in fact it worked.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Android files every notification under a channel, and one created implicitly
 * lands at default importance: no heads-up banner, no sound, easily missed.
 * Declaring it means the OS shows Lily the way she is meant to arrive, and the
 * user gets a named entry in system settings rather than "Miscellaneous".
 */
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('lily', {
    name: 'Lily',
    description: 'Gentle nudges and replies from Lily.',
    importance: Notifications.AndroidImportance.DEFAULT,
    // No vibration or sound by default: this app is for people who may be
    // having a hard time, and a buzzing phone is not the tone to set.
    vibrationPattern: [0],
    sound: null,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

export function usePushRegistration() {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();

  // Clerk hands back a new getToken identity on every render, so it must not sit
  // in the dependency array. A ref keeps the latest one without re-firing.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const registered = useRef(false);

  useEffect(() => {
    if (!isSignedIn || registered.current) return;

    let cancelled = false;

    (async () => {
      // Independent of push: the backend needs this to know where the user's
      // day ends, whether or not they ever allow notifications.
      reportTimezone(getTokenRef.current).catch(() => {});

      await ensureAndroidChannel();

      const pushToken = await getPushToken();
      if (!pushToken || cancelled) return;

      try {
        await registerDevice(getTokenRef.current, pushToken);
        registered.current = true;
      } catch {
        // Left unregistered so the next launch tries again.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // Tapping a notification should land in the conversation it is about, not on
  // whatever screen happened to be open when the app was last closed.
  useEffect(() => {
    if (!isSignedIn) return;

    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(chat)');
    });
    return () => sub.remove();
  }, [isSignedIn, router]);

  // A notification tapped while the app was killed is delivered as the initial
  // response rather than through the listener above, so it needs reading once
  // on launch or that tap is silently dropped.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !lastResponse || handledColdStart.current) return;
    handledColdStart.current = true;
    router.push('/(chat)');
  }, [isSignedIn, lastResponse, router]);
}
