import { useCheckOnboarding } from "@/hooks/useCheckOnboarding";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Linking, Text, View } from "react-native";

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
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <LinearGradient
          colors={["#FFD36A", "#FFB347", "#F5F8F7"]}
          locations={[0, 0.55, 1]}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={require("@/assets/images/loading.gif")}
              style={{ width: 180, height: 180, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
              Getting things ready for you…
            </Text>
          </View>
        </LinearGradient>
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

  return <Redirect href="/(tabs)/home" />;
}