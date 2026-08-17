import { LilyColors, LilyFonts } from '@/constants/lily';
import { API_URL } from '@/config/api';
import { BillingInterval } from '@/constants/pricing';
import { usePricing } from '@/hooks/usePricing';
import { useAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const TRIAL_STEPS = [
  {
    key: 'today',
    icon: '🔓',
    title: 'Today',
    body: 'Full access to Lily — every conversation, whenever it helps.',
  },
  {
    key: 'reminder',
    icon: '🔔',
    title: 'Day 02 · Reminder',
    body: 'We’ll send a gentle note that your trial is ending soon.',
  },
  {
    key: 'billing',
    icon: '✦',
    title: 'Day 03 · Billing starts',
    body: 'Your plan begins, unless you cancel any time before.',
  },
];

function CloseIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
      <Path d="M1 1l12 12M13 1L1 13" stroke={LilyColors.textPrimary} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={10} height={8} viewBox="0 0 10 8" fill="none">
      <Path
        d="M1 4.2l2.6 2.6L9 1.4"
        stroke={LilyColors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlanCard({
  label,
  price,
  unit,
  selected,
  onPress,
}: {
  label: string;
  price: string;
  unit: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderRadius: 18,
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor: selected ? '#0F1512' : LilyColors.surfaceAlt,
        borderWidth: 1.5,
        borderColor: selected ? LilyColors.accent : LilyColors.hairline,
      }}
    >
      <Text
        style={{
          fontSize: 13.5,
          fontFamily: LilyFonts.sans,
          color: selected ? LilyColors.textPrimary : LilyColors.textMuted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 17,
          fontFamily: LilyFonts.sansSemi,
          color: selected ? LilyColors.textPrimary : LilyColors.textBody,
          marginTop: 5,
        }}
      >
        {price}
        <Text
          style={{
            fontSize: 12.5,
            fontFamily: LilyFonts.sans,
            color: selected ? LilyColors.textMuted : LilyColors.textFaint,
          }}
        >
          {unit}
        </Text>
      </Text>
    </TouchableOpacity>
  );
}

export default function TrialOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();
  const { region, labelFor, footerFor, yearlySaving } = usePricing();

  const [interval, setInterval] = useState<BillingInterval>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    if (isLoading) return;
    if (!isSignedIn) {
      Alert.alert('Sign In Required', 'Please sign in to start your free trial.');
      return;
    }

    setIsLoading(true);

    try {
      const token = await getToken({ template: 'backend-api' });
      if (!token) throw new Error('Authentication failed');

      const res = await fetch(`${API_URL}/api/v1/billing/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // The server resolves (plan_key, region) → provider product id. `region` is a
        // display hint only — the backend must verify it against the billing country.
        body: JSON.stringify({ plan_key: interval, region }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || 'Checkout failed');
      }

      const { url } = await res.json();
      await Linking.openURL(url);
      router.back();
    } catch (err: any) {
      console.error('Checkout error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      {/* Close */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 20) + 14,
          paddingHorizontal: 22,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: LilyColors.ghostFill,
          }}
        >
          <CloseIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 }}
      >
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: 34,
            lineHeight: 39,
            color: LilyColors.textPrimary,
            marginTop: 16,
          }}
        >
          Start your 3-day free trial to keep talking
        </Text>
        <Text
          style={{
            fontSize: 13.5,
            lineHeight: 21,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textMuted,
            marginTop: 8,
          }}
        >
          Unlimited conversations, summaries, and daily reflections.
        </Text>

        {/* Trial timeline */}
        <View style={{ marginTop: 28 }}>
          {TRIAL_STEPS.map((step, i) => (
            <View key={step.key} style={{ flexDirection: 'row', gap: 14, paddingBottom: 22 }}>
              {i < TRIAL_STEPS.length - 1 && (
                <View
                  style={{
                    position: 'absolute',
                    left: 17,
                    top: 34,
                    bottom: 0,
                    width: 2,
                    backgroundColor: 'rgba(27,127,81,0.35)',
                  }}
                />
              )}
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: LilyColors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15 }}>{step.icon}</Text>
              </View>
              <View style={{ flex: 1, paddingTop: 2 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: LilyFonts.sansSemi,
                    color: LilyColors.accent,
                  }}
                >
                  {step.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13.5,
                    lineHeight: 22,
                    fontFamily: LilyFonts.sans,
                    color: LilyColors.textBody,
                    marginTop: 4,
                  }}
                >
                  {step.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Plan picker + CTA */}
      <View style={{ paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom, 16) + 14 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
          <View style={{ flex: 1 }}>
            <PlanCard
              label="Monthly"
              price={labelFor('monthly')}
              unit="/month"
              selected={interval === 'monthly'}
              onPress={() => setInterval('monthly')}
            />
          </View>

          <View style={{ flex: 1, position: 'relative' }}>
            {yearlySaving > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -11,
                  right: 8,
                  backgroundColor: LilyColors.accent,
                  borderRadius: 100,
                  paddingVertical: 4,
                  paddingHorizontal: 9,
                  zIndex: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontFamily: LilyFonts.sansBold,
                    color: LilyColors.ground,
                    letterSpacing: 0.3,
                  }}
                >
                  SAVE {yearlySaving}%
                </Text>
              </View>
            )}
            <PlanCard
              label="Yearly"
              price={labelFor('yearly')}
              unit="/year"
              selected={interval === 'yearly'}
              onPress={() => setInterval('yearly')}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 18,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(63,191,127,0.16)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckIcon />
          </View>
          <Text style={{ fontSize: 14, fontFamily: LilyFonts.sans, color: LilyColors.textStrong }}>
            No payment due now
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleStartTrial}
          disabled={isLoading}
          style={{
            marginTop: 16,
            backgroundColor: isLoading
              ? 'rgba(63,191,127,0.5)'
              : LilyColors.accent,
            borderRadius: 100,
            paddingVertical: 17,
            paddingHorizontal: 20,
            alignItems: 'center',
            transform: [{ scale: 1 }],
            shadowColor: LilyColors.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 26,
            elevation: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={LilyColors.ground} />
          ) : (
            <Text
              style={{ fontSize: 16, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}
            >
              Start my 3-day free trial
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            lineHeight: 18,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textFaint,
            marginTop: 12,
          }}
        >
          {footerFor(interval)}
        </Text>
      </View>
    </View>
  );
}
