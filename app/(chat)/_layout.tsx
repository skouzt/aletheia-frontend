import { ConnectionRetry } from '@/components/ConnectionRetry';
import { LilyColors } from '@/constants/lily';
import { useCheckOnboarding } from '@/hooks/useCheckOnboarding';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

/**
 * The gate for chat, rather than only on the entry screen.
 *
 * index.tsx checks onboarding, but nothing reaches chat only through index:
 * tapping a notification pushes /(chat) directly, and so does returning from
 * checkout. Someone who never finished onboarding could land straight in a
 * conversation with no profile behind it — one account has chatted with no
 * user_info row and two have sessions without one.
 *
 * Guarding the layout catches every route into chat, however it was opened.
 */
export default function ChatLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding, isLoading, unreachable, retry } = useCheckOnboarding();

  if (!isLoaded || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: LilyColors.ground,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  // Unknown is not a pass. Falling through here would be the same hole in a
  // different shape: offer the retry instead of guessing.
  if (unreachable) {
    return <ConnectionRetry onRetry={retry} />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding_form)/personal" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: LilyColors.ground },
      }}
    />
  );
}
