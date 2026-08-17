import { LilyColors, LilyFonts, LilyGradients } from '@/constants/lily';
import { usePricing } from '@/hooks/usePricing';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

interface Payment {
  id: string;
  date: string | null;
  description: string;
  amount: string;
  status: string;
}

function BackIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M9 1L3 7l6 6"
        stroke="#E4E4E4"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TickIcon() {
  return (
    <Svg width={11} height={9} viewBox="0 0 12 10" fill="none">
      <Path
        d="M1 5.2l3.4 3.4L11 1.6"
        stroke={LilyColors.accent}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 9,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        fontFamily: LilyFonts.sans,
        color: LilyColors.textFaint,
        paddingHorizontal: 4,
        paddingTop: 18,
        paddingBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: '#0F0F0F',
        borderWidth: 1,
        borderColor: accent ? 'rgba(63,191,127,0.22)' : 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const sub = useSubscription();
  const { region } = usePricing();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Clerk returns a new getToken each render — never put it in a dep array.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getTokenRef.current({ template: 'backend-api' });
        if (!token) return;
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/billing/payments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!res.ok || cancelled) return;
        const data: { payments?: Payment[] } = await res.json();
        setPayments(data.payments ?? []);
      } catch {
        // History is informational — the screen stands without it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // "Change plan" means upgrade monthly → yearly. Send them straight to the Dodo
  // checkout for that plan rather than back through the trial offer, which they've
  // already taken and which would read as a downgrade of their own subscription.
  const startCheckout = useCallback(async (interval: 'monthly' | 'yearly') => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      const token = await getTokenRef.current({ template: 'backend-api' });
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/billing/create-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ plan_key: interval, region }),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      if (!url) throw new Error('No checkout URL');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Something went wrong', 'Could not open checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }, [checkingOut, region]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel subscription?',
      `You'll keep access until ${formatDate(sub.expiresAt ?? null) || 'the end of the period'}.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const token = await getTokenRef.current({ template: 'backend-api' });
              const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/v1/billing/cancel-subscription`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                  },
                },
              );
              if (!res.ok) throw new Error(await res.text());
              await sub.refresh();
              Alert.alert('Cancelled', 'Your plan will not renew.');
            } catch {
              Alert.alert('Something went wrong', 'Please try again in a moment.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }, [sub]);

  const hasPlan = sub.plan !== 'none';
  const isCancelled = sub.status === 'cancelled';
  // Yearly is the top plan — there is nothing to change to, so offering "Change plan"
  // would only lead to a checkout for what they already have.
  const canUpgrade = hasPlan && sub.plan === 'monthly' && !isCancelled;
  // Nothing left to cancel once it's cancelled; the plan simply won't renew.
  const canCancel = hasPlan && !isCancelled;
  const price =
    sub.amount != null && sub.currency
      ? `${sub.currency === 'INR' ? '₹' : '$'}${sub.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '—';

  const detailRows: { label: string; value: string }[] = [
    { label: 'Plan', value: hasPlan ? `Lily Unlimited · ${sub.plan === 'yearly' ? 'Yearly' : 'Monthly'}` : 'None' },
    { label: isCancelled ? 'Access until' : sub.isTrialing ? 'Trial ends' : 'Renews on', value: formatDate(sub.nextBillingDate ?? sub.expiresAt ?? null) || '—' },
    { label: 'Status', value: sub.status === 'none' ? 'Not subscribed' : sub.status[0].toUpperCase() + sub.status.slice(1) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 20) + 14,
          paddingHorizontal: 18,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BackIcon />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: LilyFonts.serif,
            fontSize: 19,
            color: LilyColors.textPrimary,
          }}
        >
          Subscription
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 34 }}
      >
        {/* Current plan */}
        <Card accent={hasPlan}>
          <View style={{ paddingVertical: 15, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: LilyFonts.sansSemi,
                  color: LilyColors.textPrimary,
                }}
              >
                {hasPlan ? 'Lily Unlimited' : 'No active plan'}
              </Text>
              {hasPlan && (
                <View
                  style={{
                    backgroundColor: 'rgba(63,191,127,0.12)',
                    borderRadius: 100,
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9.5,
                      letterSpacing: 0.4,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.accentBright,
                    }}
                  >
                    {isCancelled ? 'ENDING' : sub.isTrialing ? 'TRIAL' : sub.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 9 }}>
              <Text
                style={{
                  fontSize: 23,
                  letterSpacing: -0.4,
                  fontFamily: LilyFonts.sansSemi,
                  color: LilyColors.textPrimary,
                }}
              >
                {price}
              </Text>
              {hasPlan && (
                <Text
                  style={{ fontSize: 11, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}
                >
                  / {sub.period ?? (sub.plan === 'yearly' ? 'year' : 'month')}
                </Text>
              )}
            </View>

            <Text
              style={{
                fontSize: 11,
                fontFamily: LilyFonts.sans,
                color: '#7C8B83',
                marginTop: 4,
              }}
            >
              {!hasPlan
                ? 'Start a plan to keep talking to Lily.'
                : isCancelled
                  ? `Cancelled — you keep access until ${formatDate(sub.expiresAt ?? null) || 'the period ends'}`
                  : `${sub.isTrialing ? 'Trial ends' : 'Next payment'} on ${formatDate(sub.nextBillingDate ?? sub.expiresAt ?? null) || '—'}`}
            </Text>

            <View style={{ flexDirection: 'row', gap: 7, marginTop: 13 }}>
              {(!hasPlan || isCancelled) && (
                <TouchableOpacity
                  onPress={() =>
                    isCancelled ? startCheckout(sub.plan === 'yearly' ? 'yearly' : 'monthly') : router.push('/paywall')
                  }
                  style={{ flex: 1, borderRadius: 100, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={LilyGradients.signUp}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={{ paddingVertical: 9, alignItems: 'center' }}
                  >
                    <Text
                      style={{ fontSize: 11.5, fontFamily: LilyFonts.sansSemi, color: '#DCF3E6' }}
                    >
                      {isCancelled ? 'Resubscribe' : 'Choose a plan'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {canUpgrade && (
                <TouchableOpacity
                  onPress={() => startCheckout('yearly')}
                  disabled={checkingOut}
                  style={{ flex: 1, borderRadius: 100, overflow: 'hidden', opacity: checkingOut ? 0.5 : 1 }}
                >
                  <LinearGradient
                    colors={LilyGradients.signUp}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={{ paddingVertical: 9, alignItems: 'center' }}
                  >
                    <Text
                      style={{ fontSize: 11.5, fontFamily: LilyFonts.sansSemi, color: '#DCF3E6' }}
                    >
                      {checkingOut ? 'Opening…' : 'Change plan'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {canCancel && (
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: '#171717',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 100,
                    paddingVertical: 9,
                    opacity: cancelling ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.textSoft,
                    }}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel plan'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Details */}
        <SectionLabel>Details</SectionLabel>
        <Card>
          {detailRows.map((r, i) => (
            <View
              key={r.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textSoft,
                }}
              >
                {r.label}
              </Text>
              <Text
                style={{
                  fontSize: 12.5,
                  fontFamily: LilyFonts.sansMedium,
                  color: LilyColors.textPrimary,
                }}
              >
                {r.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Payment history */}
        {payments.length > 0 && (
          <>
            <SectionLabel>Payment history</SectionLabel>
            <Card>
              {payments.map((p, i) => (
                <View
                  key={p.id || i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 11,
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: 'rgba(63,191,127,0.10)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TickIcon />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontFamily: LilyFonts.sansMedium,
                        color: LilyColors.textPrimary,
                      }}
                    >
                      {p.description}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontFamily: LilyFonts.sans,
                        color: LilyColors.textFaint,
                        marginTop: 2,
                      }}
                    >
                      {[formatDate(p.date), p.status].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.textStrong,
                    }}
                  >
                    {p.amount}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <Text
          style={{
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 15.5,
            fontFamily: LilyFonts.sans,
            color: '#5E7268',
            paddingTop: 16,
            paddingHorizontal: 14,
          }}
        >
          {!hasPlan
            ? 'Receipts are emailed after each payment.'
            : isCancelled
              ? 'Your plan will not renew. Resubscribe any time to keep going.'
              : `Receipts are emailed after each payment. Cancelling keeps access until ${formatDate(sub.expiresAt ?? null) || 'the end of the period'}.`}
        </Text>
      </ScrollView>
    </View>
  );
}
