import { ConnectionRetry } from "@/components/ConnectionRetry";
import { useCheckOnboarding } from "@/hooks/useCheckOnboarding";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding, isLoading, unreachable, retry } = useCheckOnboarding();

  // Without this the redirect below reads an unknown status as "not onboarded"
  // and pushes a signed-in user into a form they may have already completed.
  if (isSignedIn && unreachable) {
    return <ConnectionRetry onRetry={retry} />;
  }

  if (!isLoaded || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isSignedIn) {
    return (
      <Redirect
        href={
          hasCompletedOnboarding
            ? "/(chat)"
            : "/(onboarding_form)/personal"
        }
      />
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
