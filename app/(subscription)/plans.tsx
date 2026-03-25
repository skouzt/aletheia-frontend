import { API_URL } from "@/config/api";
import { checkSubscriptionOnce } from "@/hooks/subscriptionActivation";
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
  Easing,
  SlideInDown
} from "react-native-reanimated";

type PlanType = "clarity" | "insight";

const PLAN_CONFIG: Record<PlanType, {
  name: string;
  price: string;
  dailyMinutes: string;
}> = {
   clarity: {
    name: "Clarity",
    price: "$14",
    dailyMinutes: "40 min × 10 sessions",
  },
  insight: {
    name: "Insight",
    price: "$19",
    dailyMinutes: "40 min × 15 sessions",
  },
};

// ✅ Add helper function to safely access plan config
const getPlanConfig = (plan: string) => {
  if (plan === "clarity" || plan === "insight") {
    return PLAN_CONFIG[plan];
  }
  return PLAN_CONFIG.clarity; // Default fallback
};

const PLAN_DETAILS: Record<
  PlanType,
  {
    caption: string;
    description: string;
    features: string[];
  }
> = {
  clarity: {
    caption: "Steady support",
    description:
      "A balanced option for building a consistent monthly reflection habit.",
    features: [
      "10 monthly conversation sessions",
      "40-minute sessions",
      "Session summaries after every session",
    ],
  },
  insight: {
    caption: "Deeper access",
    description:
      "More room each month for regular check-ins and deeper conversations.",
    features: [
      "15 monthly conversation sessions",
      "40-minute sessions",
      "Session summaries after every session",
    ],
  },
};



  export default function SubscriptionScreen() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const { plan: currentPlan, refresh } = useSubscription();

    const [selectedPlan, setSelectedPlan] = useState<PlanType>("clarity");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);


    const handleClose = () => {
    setLoading(false);
    setChecking(false);
    
    router.replace("/(tabs)/home");
  };

  const handleCheckSubscription = async () => {
  if (!isLoaded || !isSignedIn) {
    Alert.alert("Error", "Please sign in first");
    return;
  }

  setChecking(true);
  
  try {
    const result = await checkSubscriptionOnce({
      getToken,
      isLoaded,
      isSignedIn,
      refresh,
    });

    if (result.status === "activated") {
      Alert.alert(
        "✅ Subscription Found!",
        `Your ${PLAN_CONFIG[result.plan].name} plan is now active. ${PLAN_CONFIG[result.plan].dailyMinutes}.`,
        [{ text: "Great!",  onPress: () => router.dismiss()}]
      );
    } else if (result.status === "pending") {
      Alert.alert(
        "No Subscription Found",
        "If you just purchased, please wait a moment and try again."
      );
    } else if (result.status === "auth_required") {
      Alert.alert("Error", "Please sign in first");
    } else {
      Alert.alert("Error", result.message || "Failed to check subscription");
    }
  } catch (error: any) {
    console.error("Check error:", error);
    Alert.alert("Error", error.message || "Failed to check subscription");
  } finally {
    setChecking(false);
  }
};

  useEffect(() => {
  if (currentPlan === "clarity" || currentPlan === "insight") {
    router.replace("/(subscription)/manage"); 
  }
}, [currentPlan]);
   
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

    
  } catch (err: any) {
    console.error("Checkout error:", err);
    Alert.alert("Error", err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};

    const isCurrentPlan = (plan: PlanType) => currentPlan === plan;
    const hasNoSubscription = currentPlan === "none";
    const currentPlanConfig =
      currentPlan === "none" ? null : getPlanConfig(currentPlan);
  
    return (
      <View className="flex-1 justify-end bg-black/45 pt-safe">
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          className="overflow-hidden rounded-t-[32px] bg-[#F6F8F7]"
          style={{ top: 10, height: "94%" }}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <View className="relative">
              <LinearGradient
                colors={["#FFE6A0", "#F7EED7", "#F6F8F7"]}
                locations={[0, 0.58, 1]}
                className="absolute left-0 right-0 top-0 h-[260px]"
              />

              <View className="items-center pt-3">
                <View className="h-1.5 w-12 rounded-full bg-[#101816]/10" />
              </View>

              <View className="absolute right-5 top-5 z-20">
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  className="h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/80"
                >
                  <Ionicons name="close" size={22} color="#101816" />
                </Pressable>
              </View>

              <View className="px-6 pb-5 pt-4">
                <View className="items-center">
                  <View className="h-32 w-full items-center justify-center">
                    <Image
                      source={require("@/assets/images/subscribe.png")}
                      className="h-full w-full"
                      resizeMode="contain"
                    />
                  </View>

                  <Text className="mt-3 text-xs font-semibold uppercase tracking-[2px] text-[#5B8877]">
                    Membership
                  </Text>
                  <Text className="mt-2 text-center text-[28px] font-bold leading-[34px] text-[#101816]">
                    Choose the pace that fits your month
                  </Text>
                  <Text className="mt-3 max-w-[310px] text-center text-sm leading-6 text-[#5D6E67]">
                    Start with Clarity or move up to Insight for more sessions
                    and deeper monthly support.
                  </Text>
                </View>

                <View className="mt-5 flex-row items-center gap-3 rounded-[22px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#019863]/10">
                    <Ionicons
                      name={
                        currentPlanConfig ? "sparkles-outline" : "card-outline"
                      }
                      size={20}
                      color="#019863"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#5B8877]">
                      {currentPlanConfig ? "Current membership" : "Start here"}
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold text-[#101816]">
                      {currentPlanConfig
                        ? `${currentPlanConfig.name} is active`
                        : "Pick the plan that matches your pace"}
                    </Text>
                    <Text className="mt-0.5 text-xs leading-5 text-[#5D6E67]">
                      {currentPlanConfig
                        ? `${currentPlanConfig.dailyMinutes} included each month.`
                        : "You can upgrade later if you want more sessions."}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="px-6 pb-3 pt-1">
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#5B8877]">
                Compare plans
              </Text>
              <Text className="mt-2 text-[22px] font-bold text-[#101816]">
                Simple pricing, clear monthly access
              </Text>
            </View>

            <View className="px-5 gap-3">
              <PlanCard
                plan="clarity"
                selected={selectedPlan === "clarity"}
                isCurrent={isCurrentPlan("clarity")}
                disabled={currentPlan === "insight"}
                onPress={() => setSelectedPlan("clarity")}
              />

              <PlanCard
                plan="insight"
                selected={selectedPlan === "insight"}
                isCurrent={isCurrentPlan("insight")}
                popular
                onPress={() => setSelectedPlan("insight")}
              />
            </View>

            <View className="mx-5 mt-4 rounded-[22px] border border-[#DDE7E2] bg-white p-4">
              <View className="flex-row items-start gap-3">
                <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-2xl bg-[#019863]/10">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#019863"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#101816]">
                    Secure browser checkout
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-[#5D6E67]">
                    {"You'll finish payment in your browser and can come back here to confirm the subscription if it takes a moment to activate."}
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-5 pb-4 pt-5">
              <Pressable
                onPress={handleUpgrade}
                disabled={loading || isCurrentPlan(selectedPlan)}
                className={`h-14 w-full flex-row items-center justify-center gap-2 rounded-2xl ${
                  loading || isCurrentPlan(selectedPlan)
                    ? "bg-gray-400"
                    : "bg-[#019863]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : isCurrentPlan(selectedPlan) ? (
                  <Text className="text-base font-bold text-white">
                    Current Plan
                  </Text>
                ) : (
                  <>
                    <Text className="text-base font-bold text-white">
                      {hasNoSubscription ? "Subscribe Now" : "Upgrade Now"}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
                )}
              </Pressable>

              {currentPlan === "none" && (
                <Pressable
                  onPress={handleCheckSubscription}
                  disabled={checking}
                  className="mt-3 h-12 w-full flex-row items-center justify-center gap-2 rounded-2xl border border-[#019863]/20 bg-white"
                >
                  {checking ? (
                    <ActivityIndicator color="#019863" />
                  ) : (
                    <>
                      <Ionicons
                        name="refresh-outline"
                        size={18}
                        color="#019863"
                      />
                      <Text className="font-semibold text-[#019863]">
                        Check Subscription Status
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {currentPlan === "none" && (
                <View className="mt-3 flex-row items-center justify-center gap-2 px-3">
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color="#6B7280"
                  />
                  <Text className="text-center text-xs text-[#6B7280]">
                    Just finished checkout? Refresh your subscription status
                    here.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
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
    const config = getPlanConfig(plan);
    const details = PLAN_DETAILS[plan];

    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        hitSlop={2}
        className={`relative overflow-hidden rounded-[26px] border p-5 ${
          selected ? "border-[#019863] bg-[#F4FBF7]" : "border-[#DDE7E2] bg-white"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <LinearGradient
          colors={
            selected
              ? ["rgba(1,152,99,0.14)", "rgba(255,255,255,0)"]
              : popular
                ? ["rgba(255,211,106,0.18)", "rgba(255,255,255,0)"]
                : ["rgba(1,152,99,0.06)", "rgba(255,255,255,0)"]
          }
          className="absolute left-0 right-0 top-0 h-28"
        />

        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <View className="mb-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-[#EEF5F1] px-3 py-1">
                <Text className="text-[11px] font-semibold uppercase text-[#3F6B5B]">
                  {details.caption}
                </Text>
              </View>
              {popular && (
                <View className="rounded-full bg-[#019863] px-3 py-1">
                  <Text className="text-[11px] font-bold uppercase text-white">
                    Most popular
                  </Text>
                </View>
              )}
              {isCurrent && (
                <View className="rounded-full bg-[#019863]/10 px-3 py-1">
                  <Text className="text-[11px] font-bold uppercase text-[#019863]">
                    Current
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-[26px] font-bold text-[#101816]">
              {config.name}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-[#5D6E67]">
              {details.description}
            </Text>
          </View>

          <View
            className={`mt-1 h-7 w-7 items-center justify-center rounded-full border-2 ${
              selected
                ? "border-[#019863] bg-[#019863]"
                : "border-[#C7D5CF] bg-white"
            }`}
          >
            {selected && <Ionicons name="checkmark" size={15} color="white" />}
          </View>
        </View>

        {popular && (
          <View className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[#019863]/5" />
        )}

        <View className="mt-5 flex-row items-end justify-between gap-3">
          <Text className="text-[36px] font-bold leading-none text-[#101816]">
            {config.price}
            <Text className="text-sm font-medium text-[#6B7280]">/month</Text>
          </Text>

          <View className="rounded-full bg-[#0F172A]/5 px-3 py-2">
            <Text className="text-xs font-semibold text-[#40524B]">
              {config.dailyMinutes}
            </Text>
          </View>
        </View>

        <View className="my-4 h-px bg-[#E6EEEA]" />

        <View className="gap-3">
          {details.features.map((feature) => (
            <Feature key={feature} text={feature} selected={selected} />
          ))}
        </View>

        {disabled && (
          <View className="mt-4 rounded-2xl bg-[#F4F6F5] px-4 py-3">
            <Text className="text-xs leading-5 text-[#66746F]">
              Your current plan already includes more monthly access.
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  function Feature({
    text,
    selected,
  }: {
    text: string;
    selected?: boolean;
  }) {
    return (
      <View className="flex-row items-start gap-3">
        <View
          className={`mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
            selected ? "bg-[#019863]" : "bg-[#EAF6F1]"
          }`}
        >
          <Ionicons
            name="checkmark"
            size={14}
            color={selected ? "#FFFFFF" : "#019863"}
          />
        </View>
        <Text className="flex-1 text-sm leading-6 text-[#4F625B]">{text}</Text>
      </View>
    );
  }
