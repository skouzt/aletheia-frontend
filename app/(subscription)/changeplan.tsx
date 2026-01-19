import { API_URL } from "@/config/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

type PlanType = "guided" | "extended";

export default function ChangePlan() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { plan, status } = useSubscription();

  const isGuided = plan === "guided";
  const isExtended = plan === "extended";

  const [isVisible, setIsVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 350);
  };

  useEffect(() => {
    return () => setIsProcessing(false);
  }, []);

  const startCheckout = async (targetPlan: "guided" | "extended") => {
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
    <View className="flex-1 justify-end bg-transparent">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="rounded-t-[32px] bg-[#F6F8F7]"
          style={{ height: "95%" }}
        >
          <View className="flex-row items-center justify-between px-6 py-5">
            <View className="w-10" />
            <Text className="text-2xl font-bold text-[#0F172A]">
              Change Plan
            </Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text className="text-slate-500 text-center text-sm px-6 mb-6">
              Choose the plan that best supports your journey.
            </Text>

            <PlanCard
              name="Guided"
              price="$15"
              minutes="60 minutes/day"
              features={[
                "Guided conversations",
                "Session summaries",
                "Daily reflection",
              ]}
              isCurrent={isGuided}
              onSelect={() => startCheckout("guided")}
              disabled={isProcessing}
            />

            <PlanCard
              name="Extended"
              price="$50"
              minutes="480 minutes/day"
              highlight
              features={[
                "Extended access time",
                "Priority support",
                "Long-form sessions",
              ]}
              isCurrent={isExtended}
              onSelect={() => startCheckout("extended")}
              disabled={isProcessing}
            />

            <Text className="text-xs text-slate-400 text-center mt-6 px-10">
              Subscriptions auto-renew. You can cancel anytime via Gumroad.
            </Text>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function PlanCard({
  name,
  price,
  minutes,
  features,
  isCurrent,
  highlight,
  onSelect,
  disabled,
}: {
  name: string;
  price: string;
  minutes: string;
  features: string[];
  isCurrent: boolean;
  highlight?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const borderClass = highlight ? "border border-[#019863]/20" : "border border-slate-100";
  const opacityClass = disabled ? "opacity-50" : "";
  const buttonClass = isCurrent ? "bg-slate-200" : "bg-[#019863]";
  const buttonTextClass = isCurrent ? "text-slate-400" : "text-white";

  return (
    <View className={`mx-6 mb-5 bg-white rounded-2xl p-6 ${borderClass} ${opacityClass}`}>
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-xl font-bold">{name}</Text>
        {isCurrent && (
          <View className="px-3 py-1 rounded-full bg-slate-100">
            <Text className="text-xs font-semibold text-slate-600">
              CURRENT
            </Text>
          </View>
        )}
      </View>

      <Text className="text-3xl font-bold mb-1">
        {price}
        <Text className="text-sm text-slate-500"> / month</Text>
      </Text>

      <Text className="text-slate-500 mb-4">{minutes}</Text>

      {features.map((f) => (
        <Feature key={f} text={f} highlight={highlight} />
      ))}

      <Pressable
        disabled={disabled || isCurrent}
        onPress={onSelect}
        className={`h-12 rounded-xl items-center justify-center mt-5 ${buttonClass}`}
      >
        <Text className={`font-semibold ${buttonTextClass}`}>
          {isCurrent ? "Current Plan" : "Select Plan"}
        </Text>
      </Pressable>
    </View>
  );
}

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  const iconName = highlight ? "checkmark-circle" : "checkmark";
  return (
    <View className="flex-row items-start gap-3 mb-2">
      <Ionicons name={iconName} size={18} color="#019863" />
      <Text className="text-slate-600">{text}</Text>
    </View>
  );
}