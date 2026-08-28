import { LilyColors, LilyFonts } from '@/constants/lily';
import {
  LilyGhostButton,
  LilyPageTitle,
  LilyRow,
  LilyScreen,
  LilyScroll,
  LilyToggle,
} from '@/components/lily/ui';
import { useSubscription } from '@/hooks/useSubscription';
import { usePersonalization } from '@/hooks/usePersonalization';
import { clearCache } from '@/state/personalization';
import { useAuth, useClerk } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {
  fetchPreferences,
  getExistingPushToken,
  getPushToken,
  registerDevice,
  setPreferences,
  unregisterDevice,
} from '@/services/pushNotifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, TouchableOpacity, Text, View } from 'react-native';

/** Falls back only if expoConfig is somehow unavailable; app.json is the source. */
const APP_VERSION = Constants.expoConfig?.version ?? '—';

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 15,
        fontFamily: LilyFonts.sansBold,
        color: LilyColors.textPrimary,
        paddingHorizontal: 2,
        paddingBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const { plan, status, isTrialing, loading: subLoading } = useSubscription();

  // Server-backed so the tone is right even on a device that has never opened the
  // Personalization screen. No refetch on focus: that screen publishes into the
  // shared store when it saves, so this updates without another round-trip.
  const { personalization } = usePersonalization();
  const tone = personalization.tone;

  // Blank while loading rather than defaulting to "Not subscribed" — the hook starts
  // at status 'none', so a paying customer would otherwise see that flash first.
  const subscriptionValue = subLoading
    ? ''
    : isTrialing
      ? 'Free trial'
      : status === 'active'
        ? plan === 'yearly'
          ? 'Yearly'
          : 'Monthly'
        : status === 'cancelled'
          ? 'Ending soon'
          : status === 'past_due'
            ? 'Payment issue'
            : 'Not subscribed';

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Clerk hands back a new getToken identity on every render, so it must not sit
  // in a dependency array.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  // The toggle reflects the server, not this screen's memory. Before, it lived
  // in useState alone: a user turned notifications on, navigated away, came
  // back and found it off, while nothing had ever been recorded anywhere.
  useEffect(() => {
    let cancelled = false;
    fetchPreferences(getTokenRef.current)
      .then((prefs) => {
        if (!cancelled) setNotificationsEnabled(prefs.enabled);
      })
      .catch(() => {
        // Leave it off rather than showing a state we could not confirm.
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [frequency, setFrequency] = useState<'Daily' | 'Weekdays'>('Daily');
  const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (savingNotifications) return;
    setSavingNotifications(true);

    // Optimistic: the switch should move under the thumb, not after a round trip.
    setNotificationsEnabled(value);

    try {
      if (value) {
        // Permission and registration in one step — turning the toggle on is
        // meaningless unless this device is actually addressable afterwards.
        const pushToken = await getPushToken();
        if (!pushToken) {
          setNotificationsEnabled(false);
          Alert.alert(
            'Notifications are off',
            'Enable notifications for Lily in your device settings to hear from her.',
          );
          return;
        }
        await registerDevice(getTokenRef.current, pushToken);
      }

      const prefs = await setPreferences(getTokenRef.current, value);
      setNotificationsEnabled(prefs.enabled);
    } catch {
      // Put the switch back where it was; nothing was saved.
      setNotificationsEnabled(!value);
      Alert.alert('Could not save', 'Please try again in a moment.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Cleared before signOut, while the user id is still available. The cache is
      // already per-user so this is not a correctness fix — it is not leaving a
      // copy of someone's private note on a device they just signed out of.
      if (userId) await clearCache(userId);

      // Detach this device for the same reason. Left registered, Lily would keep
      // pushing to a phone whose owner signed out — messages landing on a lock
      // screen that is no longer theirs. Best effort: a failure here must not
      // trap someone in a session they are trying to leave.
      try {
        // Deliberately the non-prompting variant: asking someone to allow
        // notifications while they are signing out would be absurd.
        const pushToken = await getExistingPushToken();
        if (pushToken) await unregisterDevice(getTokenRef.current, pushToken);
      } catch {
        // Sign out anyway.
      }

      await signOut();
      Linking.openURL(Linking.createURL('/'));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <LilyScreen>
      <LilyPageTitle>Settings</LilyPageTitle>

      <LilyScroll contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 22, paddingBottom: 46 }}>
        {/* ── Account ────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 26 }}>
          <GroupTitle>Account</GroupTitle>
          <View style={{ gap: 10 }}>
            <LilyRow icon="👤" label="Your Profile" onPress={() => router.push('/(profile)')} />
            {/* 🌸 rather than the design's ◎ — that glyph has no emoji presentation
                on Android, so it rendered as a hairline outline next to the
                full-colour icons around it. Matches LilyMenu's "How Lily talks to
                me", which opens this same screen. */}
            <LilyRow
              icon="🌸"
              label="Personalization"
              value={tone}
              onPress={() => router.push('/(personalization)')}
            />
            <LilyRow
              icon="💳"
              label="Subscription"
              value={subscriptionValue}
              onPress={() => router.push('/(subscription)')}
            />
          </View>
        </View>

        {/* ── Privacy ────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 26 }}>
          <GroupTitle>Privacy</GroupTitle>
          <View style={{ gap: 10 }}>
            <LilyRow
              icon="📄"
              label="Data Privacy Policy"
              onPress={() => router.push('/(privacy)')}
            />
            <LilyRow
              icon="⚙️"
              label="Manage Your Data"
              onPress={() => router.push('/(managedata)')}
            />
          </View>
        </View>

        {/* ── Notifications ──────────────────────────────────────────────── */}
        <View style={{ marginTop: 26 }}>
          <GroupTitle>Notifications</GroupTitle>
          <View style={{ gap: 10 }}>
            <LilyRow
              icon="🔔"
              label="Enable Notifications"
              sub="Adjust your daily check-in reminders"
              showChevron={false}
              right={
                <LilyToggle value={notificationsEnabled} onChange={handleToggleNotifications} />
              }
            />
            <LilyRow
              icon="🕐"
              label="Frequency"
              value={frequency}
              onPress={
                notificationsEnabled ? () => setShowFrequencyOptions((prev) => !prev) : undefined
              }
            />

            {notificationsEnabled && showFrequencyOptions && (
              <View
                style={{
                  backgroundColor: LilyColors.surfaceRaised,
                  borderWidth: 1,
                  borderColor: LilyColors.hairline,
                  borderRadius: 18,
                  paddingHorizontal: 16,
                  marginLeft: 38,
                }}
              >
                {(['Daily', 'Weekdays'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => {
                      setFrequency(option);
                      setShowFrequencyOptions(false);
                    }}
                    style={{
                      paddingVertical: 13,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: LilyFonts.sans,
                        color: LilyColors.textBody,
                      }}
                    >
                      {option}
                    </Text>
                    {frequency === option && (
                      <Text style={{ color: LilyColors.accent, fontSize: 14 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── About ──────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 26 }}>
          <GroupTitle>About</GroupTitle>
          <View style={{ gap: 10 }}>
            {/* Read from app.json rather than hardcoded — this row said 1.0.0 while
                the app was on 2.0.8, because a literal here has to be remembered
                on every release and never is. */}
            <LilyRow
              icon="ℹ️"
              label="App Version"
              value={APP_VERSION}
              showChevron={false}
              right={<View />}
            />
            <LilyRow icon="❓" label="Help & Support" onPress={() => router.push('/(support)')} />
            <LilyRow icon="🤍" label="Safety Resources" onPress={() => router.push('/(support)')} />
          </View>
        </View>

        <LilyGhostButton
          label="Sign Out"
          tone="danger"
          onPress={handleSignOut}
          style={{ marginTop: 26 }}
        />
      </LilyScroll>
    </LilyScreen>
  );
}
