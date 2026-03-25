import { checkSubscriptionWithRetry } from "@/hooks/subscriptionActivation";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  View,
} from "react-native";

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
        router.replace("/(auth)/auth");
        return;
      }

      const result = await checkSubscriptionWithRetry({
        getToken,
        isLoaded,
        isSignedIn,
        refresh,
      });
      console.log("retry result:", result.status);
      if (cancelled) {
        return;
      }

      if (result.status === "activated") {
        router.replace("/(tabs)/home");
        return;
      }

      if (result.status === "auth_required") {
        router.replace("/(auth)/auth");
        return;
      }

      const title = result.status === "error" ? "Error" : "Still Processing";
      const message =
        result.status === "error"
          ? result.message
          : "Your payment is being processed. Please check your subscription status again in a moment.";

      Alert.alert(title, message, [
        {
          text: "Back to plans",
          onPress: () => router.replace("/(subscription)/plans"),
        },
      ]);
    };

    completeCheckout();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, refresh, router]);

  

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LinearGradient
        colors={["#FFE6A0", "#F7EED7", "#F6F8F7"]}
        locations={[0, 0.58, 1]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Image
            source={require("@/assets/images/subscribe1.gif")}
            style={{ width: 180, height: 180, marginBottom: 20 }}
            resizeMode="contain"
          />

          <ActivityIndicator size="large" color="#019863" />

          <Text className="mt-5 text-center text-2xl font-bold text-[#101816]">
            Confirming your subscription
          </Text>
          <Text className="mt-3 max-w-[280px] text-center text-sm leading-6 text-[#5D6E67]">
            We&apos;re syncing your Dodo payment now. You&apos;ll be sent to your
            home page as soon as everything is active.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
