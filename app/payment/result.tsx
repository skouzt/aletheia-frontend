import { LilyColors, LilyFonts } from '@/constants/lily';
import { checkSubscriptionWithRetry } from '@/hooks/subscriptionActivation';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

let checkoutStarted = false;

export default function PaymentResultScreen() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { refresh } = useSubscription();

  useEffect(() => {
    checkoutStarted = false;
    if (!isLoaded || checkoutStarted) return;
    checkoutStarted = true;
    let cancelled = false;

    const completeCheckout = async () => {
      if (!isSignedIn) {
        router.replace('/(auth)/auth');
        return;
      }

      const result = await checkSubscriptionWithRetry({
        getToken,
        isLoaded,
        isSignedIn,
        refresh,
      });

      if (cancelled) return;

      if (result.status === 'activated') {
        router.replace('/(chat)');
        return;
      }

      if (result.status === 'auth_required') {
        router.replace('/(auth)/auth');
        return;
      }

      const title = result.status === 'error' ? 'Error' : 'Still Processing';
      const message =
        result.status === 'error'
          ? result.message
          : 'Your payment is being processed. Please check your subscription status again in a moment.';

      Alert.alert(title, message, [
        {
          text: 'Back to plans',
          onPress: () => router.replace('/paywall'),
        },
      ]);
    };

    completeCheckout();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, refresh, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: LilyColors.ground,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(63,191,127,0.10)',
          borderWidth: 1,
          borderColor: 'rgba(63,191,127,0.22)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 36,
        }}
      >
        <ActivityIndicator size="large" color={LilyColors.accent} />
      </View>

      <Text
        style={{
          fontFamily: LilyFonts.serif,
          fontSize: 28,
          lineHeight: 34,
          textAlign: 'center',
          color: LilyColors.textPrimary,
        }}
      >
        Confirming your subscription
      </Text>
      <Text
        style={{
          marginTop: 12,
          maxWidth: 300,
          textAlign: 'center',
          fontSize: 14,
          lineHeight: 23,
          fontFamily: LilyFonts.sans,
          color: LilyColors.textMuted,
        }}
      >
        We&apos;re syncing your payment now. You&apos;ll be back with Lily as soon as everything is
        active.
      </Text>
    </View>
  );
}
