import { LilyColors, LilyFonts } from "@/constants/lily";
import { useCheckOnboarding } from "@/hooks/useCheckOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useCheckOnboarding();
  const { plan, refresh, loading: subLoading } = useSubscription();

  const [delayDone, setDelayDone] = useState(false);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayDone(true);
    }, 2000);

    Linking.getInitialURL().then((url) => {
      setInitialUrl(url);
    });

    refresh(); 
    return () => clearTimeout(timer);
  }, []);

  // ✅ LOADING STATE
  if (
    !isLoaded ||
    isLoading ||
    subLoading ||
    !delayDone ||
    hasCompletedOnboarding === null
  ) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: LilyColors.ground,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: 40,
            color: LilyColors.textPrimary,
          }}
        >
          Lily
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textFaint,
            marginTop: 10,
          }}
        >
          Getting things ready for you…
        </Text>
      </View>
    );
  }

  if (initialUrl?.includes("payment/result")) {
    return <Redirect href="/payment/result" />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding_form)/personal" />;
  }

  // Chat is the landing surface — there is no separate home screen in the design.
  return <Redirect href="/(chat)" />;
}