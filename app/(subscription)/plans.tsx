  import { API_URL } from "@/config/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

  type PlanType = "guided" | "extended";

const PLAN_CONFIG: Record<PlanType, {
  name: string;
  price: string;
  dailyMinutes: string;
}> = {
  guided: {
    name: "Guided",
    price: "$15",
    dailyMinutes: "60 minutes per day",
  },
  extended: {
    name: "Extended",
    price: "$50",
    dailyMinutes: "480 minutes per day",
  },
};

// ✅ Add helper function to safely access plan config
const getPlanConfig = (plan: string) => {
  if (plan === "guided" || plan === "extended") {
    return PLAN_CONFIG[plan];
  }
  return PLAN_CONFIG.guided; // Default fallback
};



  export default function SubscriptionScreen() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const { plan: currentPlan, refresh } = useSubscription();

    const [selectedPlan, setSelectedPlan] = useState<PlanType>("guided");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

const handleCheckSubscription = async () => {
  if (!isLoaded || !isSignedIn) {
    Alert.alert("Error", "Please sign in first");
    return;
  }

  setChecking(true);
  
  try {
    const token = await getToken({ template: "backend-api" });
    if (!token) throw new Error("Auth failed");

    console.log("Calling check-and-activate...");

    const checkRes = await fetch(
      `${API_URL}/api/v1/billing/check-and-activate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!checkRes.ok) {
      throw new Error("Failed to check subscription");
    }

    const result = await checkRes.json();
    console.log("Check result:", result);
    
    if (result.found && (result.activated || result.already_activated)) {
      console.log("✅ Subscription found, refreshing...");
      
      // ✅ IMPORTANT: Call refresh to update UI
      await refresh();
      
      const planKey: PlanType = 
        (result.plan === "guided" || result.plan === "extended") 
          ? result.plan 
          : "guided";
      
      Alert.alert(
        "✅ Subscription Found!",
        `Your ${PLAN_CONFIG[planKey].name} plan is now active. ${PLAN_CONFIG[planKey].dailyMinutes}.`,
        [{ text: "Great!", onPress: () => router.back() }]
      );
    } else if (result.already_activated) {
      console.log("ℹ️ Subscription already activated");
      await refresh();
      Alert.alert("Already Active", "Your subscription is already active.");
    } else {
      console.log("❌ No subscription found");
      Alert.alert(
        "No Subscription Found",
        "If you just purchased, please wait a moment and try again."
      );
    }
  } catch (error: any) {
    console.error("Check error:", error);
    Alert.alert("Error", error.message || "Failed to check subscription");
  } finally {
    setChecking(false);
  }
};



  useEffect(() => {
    if (currentPlan === "guided" || currentPlan === "extended") {
      setSelectedPlan(currentPlan);
    }
  }, [currentPlan]);
    /**
     * Handle plan upgrade via Stripe checkout
     */
  const handleUpgrade = async () => {
  if (!isLoaded || !isSignedIn || !user) {
    Alert.alert("Error", "Please sign in to subscribe.");
    return;
  }

  if (currentPlan === selectedPlan) {
    Alert.alert(
      "Already Active",
      `You already have the ${PLAN_CONFIG[selectedPlan].name} plan.`
    );
    return;
  }

  setLoading(true);

  try {
    const token = await getToken({ template: "backend-api" });
    if (!token) throw new Error("Auth failed");

    const res = await fetch(`${API_URL}/api/v1/billing/create-checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan_key: selectedPlan }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.detail || "Checkout failed");
    }

    const { url } = await res.json();

    await Linking.openURL(url);

    Alert.alert(
      "Complete Your Purchase",
      "Please complete your purchase in the browser. We'll check for your subscription when you return.",
      [{ text: "OK" }]
    );

    setTimeout(async () => {
      try {
        console.log("Checking for subscription activation...");
        
        const checkRes = await fetch(
          `${API_URL}/api/v1/billing/check-and-activate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (checkRes.ok) {
          const result = await checkRes.json();
          console.log("Check result:", result);
          
          if (result.found && (result.activated || result.already_activated)) {
            await refresh();
            
            // ✅ Fixed type assertion
            const planKey: PlanType = 
              (result.plan === "guided" || result.plan === "extended") 
                ? result.plan 
                : "guided";
            
            Alert.alert(
              "🎉 Subscription Active!",
              `Your ${PLAN_CONFIG[planKey].name} plan is now active. ${PLAN_CONFIG[planKey].dailyMinutes}. Enjoy your free trial!`,
              [
                {
                  text: "Start Using",
                  onPress: () => router.back(),
                },
              ]
            );
          } else {
            console.log("No subscription found");
            await refresh();
          }
        }
      } catch (error) {
        console.error("Check-and-activate error:", error);
        await refresh();
      }
    }, 5000);

  } catch (err: any) {
    console.error("Checkout error:", err);
    Alert.alert("Error", err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

    const isCurrentPlan = (plan: PlanType) => currentPlan === plan;
    const hasNoSubscription = currentPlan === "none";
  
    return (
      <View className="flex-1 justify-end bg-black/40">
        <Animated.View
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(300)}
          className="rounded-t-[32px] overflow-hidden bg-[#F5F8F7]"
          style={{ height: "95%" }}
        >
          {/* Close */}
          <View className="absolute top-6 right-4 z-20">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#101816" />
            </Pressable>
          </View>

          {/* Gradient Header */}
          <View className="relative w-full">
            <LinearGradient
              colors={["#FFD36A", "#FFB347", "#F5F8F7"]}
              locations={[0, 0.65, 1]}
              className="absolute top-0 left-0 right-0 h-[340px]"
            />
            <View className="w-full h-64 items-center justify-center px-8 pt-10">
              <Image
                source={require("@/assets/images/subscribe.png")}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
          >
            <View className="px-6 items-center mb-8">
              <Text className="text-[#101816] text-[30px] font-bold mb-2 text-center">
                Choose Your Plan
              </Text>

              {currentPlan !== "none" && (
                <Text className="text-[#019863] text-sm font-semibold mt-2">
                  Current Plan: {PLAN_CONFIG[currentPlan as PlanType]?.name}
                </Text>
              )}
            </View>

            <View className="px-5 gap-4">
              <PlanCard
                plan="guided"
                selected={selectedPlan === "guided"}
                isCurrent={isCurrentPlan("guided")}
                disabled={currentPlan === "extended"}
                onPress={() => setSelectedPlan("guided")}
              />

              <PlanCard
                plan="extended"
                selected={selectedPlan === "extended"}
                isCurrent={isCurrentPlan("extended")}
                popular
                onPress={() => setSelectedPlan("extended")}
              />
            </View>
          </ScrollView>

          {/* CTA */}
          {/* CTA */}
<View className="absolute bottom-0 left-0 w-full bg-[#F5F8F7]/95 border-t border-gray-200/50 p-5 pb-8">
  <Pressable
    onPress={handleUpgrade}
    disabled={loading || isCurrentPlan(selectedPlan)}
    className={`w-full h-14 rounded-xl items-center justify-center ${
      loading || isCurrentPlan(selectedPlan)
        ? "bg-gray-400"
        : "bg-[#019863]"
    }`}
  >
    {loading ? (
      <ActivityIndicator color="white" />
    ) : isCurrentPlan(selectedPlan) ? (
      <Text className="text-white font-bold">Current Plan</Text>
    ) : (
      <Text className="text-white font-bold">
        {hasNoSubscription ? "Subscribe Now" : "Upgrade Now"}
      </Text>
    )}
  </Pressable>

  {/* ✅ Add Check Subscription Button - Only show if user has no plan */}
  {currentPlan === "none" && (
    <Pressable
      onPress={handleCheckSubscription}
      disabled={checking}
      className="w-full h-12 rounded-xl items-center justify-center mt-3 bg-white border border-[#019863]"
    >
      {checking ? (
        <ActivityIndicator color="#019863" />
      ) : (
        <Text className="text-[#019863] font-semibold">
          Check Subscription Status
        </Text>
      )}
    </Pressable>
  )}
  
  {/* Optional: Helper text */}
  {currentPlan === "none" && (
    <Text className="text-xs text-gray-500 text-center mt-3">
      Just completed a purchase? Check your subscription status above.
    </Text>
  )}

          </View>
        </Animated.View>
      </View>
    );
  }

  /* ------------------ Components ------------------ */

  function PlanCard({
    plan,
    selected,
    popular,
    isCurrent,
    disabled,
    onPress,
  }: {
    plan: PlanType;
    selected: boolean;
    popular?: boolean;
    isCurrent?: boolean;
    disabled?: boolean;
    onPress: () => void;
  }) {
    const config = PLAN_CONFIG[plan];

    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        className={`relative rounded-2xl bg-white p-5 ${
          selected ? "border-2 border-[#019863]" : ""
        } ${disabled ? "opacity-50" : ""}`}
      >
        {popular && (
          <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#019863] px-3 py-1 rounded-full">
            <Text className="text-white text-[10px] font-bold">
              MOST POPULAR
            </Text>
          </View>
        )}

        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-lg font-bold">{config.name}</Text>
          {isCurrent && (
            <Text className="text-xs text-[#019863] font-semibold">
              CURRENT
            </Text>
          )}
        </View>

        <Text className="text-3xl font-bold mb-1">
          {config.price}
          <Text className="text-sm text-gray-500">/month</Text>
        </Text>

        <Text className="text-xs text-gray-500 mb-3">
          {config.dailyMinutes}
        </Text>

        <View className="h-px bg-gray-100 my-3" />

        <Feature text="Guided conversations" />
        <Feature text="Session summaries" />
        {plan === "extended" && <Feature text="Extended access time" />}
      </Pressable>
    );
  }

  function Feature({ text }: { text: string }) {
    return (
      <View className="flex-row items-center gap-3 mb-2">
        <Ionicons name="checkmark" size={20} color="#019863" />
        <Text className="text-sm text-gray-600">{text}</Text>
      </View>
    );
  }