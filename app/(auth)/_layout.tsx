import { useCheckOnboarding } from "@/hooks/useCheckOnboarding";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useCheckOnboarding();

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
            ? "/(tabs)/home"
            : "/(onboarding_form)/personal"
        }
      />
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
