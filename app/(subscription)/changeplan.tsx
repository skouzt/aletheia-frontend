import { API_URL } from "@/config/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

type PlanType = "clarity" | "insight";

const PLAN_DETAILS: Record<
  PlanType,
  {
    name: string;
    priceLabel: string;
    tagline: string;
    icon: keyof typeof Ionicons.glyphMap;
    sessionsPerMonth: number;
    minutesPerSession: number;
    totalMonthlyMinutes: number;
    totalDurationLabel: string;
  }
> = {
  clarity: {
    name: "Clarity",
    priceLabel: "$15/month",
    tagline: "Steady support for a consistent monthly rhythm.",
    icon: "leaf-outline",
    sessionsPerMonth: 10,
    minutesPerSession: 40,
    totalMonthlyMinutes: 400,
    totalDurationLabel: "6h 40m",
  },
  insight: {
    name: "Insight",
    priceLabel: "$20/month",
    tagline: "More room for regular check-ins and deeper reflection.",
    icon: "sparkles-outline",
    sessionsPerMonth: 15,
    minutesPerSession: 40,
    totalMonthlyMinutes: 600,
    totalDurationLabel: "10h",
  },
};

export default function ChangePlan() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { plan } = useSubscription();

  const currentPlan: PlanType | null =
    plan === "clarity" || plan === "insight" ? plan : null;

  const [isVisible, setIsVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 350);
  };

  useEffect(() => {
    return () => setIsProcessing(false);
  }, []);

  const startCheckout = async (targetPlan: PlanType) => {
    if (plan === targetPlan) return;

    setIsProcessing(true);
    try {
      const token = await getToken({ template: "backend-api" });
      if (!token) throw new Error("Auth failed");

      const res = await fetch(`${API_URL}/api/v1/billing/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_key: targetPlan }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail || "Checkout failed");
      }

      const { url } = await res.json();
      await Linking.openURL(url);
      handleClose();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to start checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/45">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="overflow-hidden rounded-t-[34px] bg-[#F5F8F6]"
          style={{ height: "94%" }}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            <View className="relative">
              <LinearGradient
                colors={["#FFE6A0", "#F7EED7", "#F5F8F6"]}
                locations={[0, 0.58, 1]}
                className="absolute left-0 right-0 top-0 h-[250px]"
              />

              <View className="items-center pt-3">
                <View className="h-1.5 w-12 rounded-full bg-[#101816]/10" />
              </View>

              <View className="flex-row items-center justify-between px-5 pt-4">
                <View className="h-10 w-10" />
                <Text className="text-[26px] font-bold text-[#101816]">
                  Change Plan
                </Text>
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  className="h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/80"
                >
                  <Ionicons name="close" size={22} color="#101816" />
                </Pressable>
              </View>

              <View className="px-6 pb-6 pt-4">
                <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#5B8877]">
                  Membership
                </Text>
                <Text className="mt-2 text-[28px] font-bold leading-[34px] text-[#101816]">
                  Choose the plan that matches your month
                </Text>
                <Text className="mt-3 text-sm leading-6 text-[#5D6E67]">
                  Compare your monthly session limits and switch anytime through
                  secure browser checkout.
                </Text>

                <View className="mt-5 flex-row items-center gap-3 rounded-[22px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#019863]/10">
                    <Ionicons
                      name={
                        currentPlan ? PLAN_DETAILS[currentPlan].icon : "card-outline"
                      }
                      size={20}
                      color="#019863"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-[11px] font-semibold uppercase tracking-wide text-[#5B8877]">
                      {currentPlan ? "Current membership" : "No active plan"}
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold text-[#101816]">
                      {currentPlan
                        ? `${PLAN_DETAILS[currentPlan].name} is active`
                        : "Pick Clarity or Insight to continue"}
                    </Text>
                    <Text className="mt-0.5 text-xs leading-5 text-[#5D6E67]">
                      {currentPlan
                        ? `${PLAN_DETAILS[currentPlan].totalMonthlyMinutes} minutes included each month.`
                        : "You can change plans later from this screen."}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="gap-3 px-5">
              <PlanCard
                planKey="clarity"
                isCurrent={currentPlan === "clarity"}
                disabled={isProcessing}
                isProcessing={isProcessing}
                onSelect={() => startCheckout("clarity")}
              />

              <PlanCard
                planKey="insight"
                isCurrent={currentPlan === "insight"}
                highlight
                disabled={isProcessing}
                isProcessing={isProcessing}
                onSelect={() => startCheckout("insight")}
              />
            </View>

            <Text className="mt-5 px-10 text-center text-xs leading-5 text-[#7B8581]">
              Subscriptions auto-renew monthly. Billing is handled through Dodo
              Payments in your browser checkout flow.
            </Text>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function PlanCard({
  planKey,
  isCurrent,
  highlight,
  onSelect,
  disabled,
  isProcessing,
}: {
  planKey: PlanType;
  isCurrent: boolean;
  highlight?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}) {
  const plan = PLAN_DETAILS[planKey];
  const borderClass = highlight
    ? "border border-[#019863]/25"
    : "border border-[#DDE7E2]";
  const opacityClass = disabled ? "opacity-50" : "";
  const buttonClass = isCurrent ? "bg-[#E8ECEA]" : "bg-[#019863]";
  const buttonTextClass = isCurrent ? "text-[#7F8884]" : "text-white";

  return (
    <View
      className={`overflow-hidden rounded-[24px] bg-white p-5 ${borderClass} ${opacityClass}`}
    >
      <LinearGradient
        colors={
          highlight
            ? ["rgba(1,152,99,0.13)", "rgba(255,255,255,0)"]
            : ["rgba(15,23,42,0.05)", "rgba(255,255,255,0)"]
        }
        className="absolute left-0 right-0 top-0 h-24"
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-[24px] font-bold text-[#101816]">{plan.name}</Text>
          <Text className="mt-1 text-base font-semibold text-[#019863]">
            {plan.priceLabel}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-[#5D6E67]">
            {plan.tagline}
          </Text>
        </View>

        <View className="items-end gap-2">
          {highlight && !isCurrent && (
            <View className="rounded-full bg-[#019863]/12 px-3 py-1">
              <Text className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#019863]">
                Popular
              </Text>
            </View>
          )}
          {isCurrent && (
            <View className="rounded-full bg-[#E8ECEA] px-3 py-1">
              <Text className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#5B6762]">
                Current
              </Text>
            </View>
          )}
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#019863]/10">
            <Ionicons name={plan.icon} size={20} color="#019863" />
          </View>
        </View>
      </View>

      <View className="my-4 h-px bg-[#E6EEEA]" />

      <Feature text={`${plan.sessionsPerMonth} sessions per month`} />
      <Feature text={`${plan.minutesPerSession} minutes per session`} />
      <Feature
        text={`Total monthly minutes: ${plan.totalMonthlyMinutes} min (${plan.totalDurationLabel})`}
      />

      <Pressable
        disabled={disabled || isCurrent}
        onPress={onSelect}
        className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${buttonClass}`}
      >
        {isProcessing && !isCurrent ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className={`font-semibold ${buttonTextClass}`}>
            {isCurrent ? "Current Plan" : `Switch to ${plan.name}`}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View className="mb-2.5 flex-row items-start gap-3">
      <Ionicons name="checkmark-circle" size={18} color="#019863" />
      <Text className="flex-1 text-[15px] leading-6 text-[#35403C]">{text}</Text>
    </View>
  );
}
