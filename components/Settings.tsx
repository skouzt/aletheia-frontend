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
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, TouchableOpacity, Text, View } from 'react-native';

/** Falls back only if expoConfig is somehow unavailable; app.json is the source. */
const APP_VERSION = Constants.expoConfig?.version ?? '—';

async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

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
  const { userId } = useAuth();
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
  const [frequency, setFrequency] = useState<'Daily' | 'Weekdays'>('Daily');
  const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications from your device settings to receive reminders.',
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  };

  const handleSignOut = async () => {
    try {
      // Cleared before signOut, while the user id is still available. The cache is
      // already per-user so this is not a correctness fix — it is not leaving a
      // copy of someone's private note on a device they just signed out of.
      if (userId) await clearCache(userId);
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
