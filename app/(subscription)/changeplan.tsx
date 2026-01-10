import { API_URL } from "@/config/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

export default function ChangePlan() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { plan, status } = useSubscription();

  const isGuided = plan === "guided";
  const isExtended = plan === "extended";

  const startCheckout = async (targetPlan: "guided" | "extended") => {
    if (plan === targetPlan) return;

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
      router.back(); // user will come back later
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to start checkout");
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Animated.View
        entering={SlideInDown.duration(400)}
        exiting={SlideOutDown.duration(300)}
        className="rounded-t-[32px] bg-[#F6F8F7]"
        style={{ height: "95%" }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-5">
          <View className="w-10" />
          <Text className="text-2xl font-serif font-bold">
            Change Plan
          </Text>
          <Pressable onPress={() => router.back()}>
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

          {/* Guided */}
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
          />

          {/* Extended */}
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
          />

          <Text className="text-xs text-slate-400 text-center mt-6 px-10">
            Subscriptions auto-renew. You can cancel anytime via Gumroad.
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ---------- Components ---------- */

function PlanCard({
  name,
  price,
  minutes,
  features,
  isCurrent,
  highlight,
  onSelect,
}: {
  name: string;
  price: string;
  minutes: string;
  features: string[];
  isCurrent: boolean;
  highlight?: boolean;
  onSelect: () => void;
}) {
  return (
    <View
      className={`mx-6 mb-5 bg-white rounded-2xl p-6 border ${
        highlight ? "border-[#019863]/20" : "border-slate-100"
      }`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-xl font-serif font-bold">{name}</Text>
        {isCurrent && (
          <View className="px-3 py-1 rounded-full bg-slate-100">
            <Text className="text-xs font-semibold text-slate-600">
              CURRENT
            </Text>
          </View>
        )}
      </View>

      <Text className="text-3xl font-serif font-bold mb-1">
        {price}
        <Text className="text-sm text-slate-500"> / month</Text>
      </Text>

      <Text className="text-slate-500 mb-4">{minutes}</Text>

      {features.map((f) => (
        <Feature key={f} text={f} highlight={highlight} />
      ))}

      <Pressable
        disabled={isCurrent}
        onPress={onSelect}
        className={`h-12 rounded-xl items-center justify-center mt-5 ${
          isCurrent ? "bg-slate-100" : "bg-[#019863]"
        }`}
      >
        <Text
          className={`font-semibold ${
            isCurrent ? "text-slate-400" : "text-white"
          }`}
        >
          {isCurrent ? "Current Plan" : "Select Plan"}
        </Text>
      </Pressable>
    </View>
  );
}

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <View className="flex-row items-start gap-3 mb-2">
      <Ionicons
        name={highlight ? "checkmark-circle" : "checkmark"}
        size={18}
        color="#019863"
      />
      <Text className="text-slate-600">{text}</Text>
    </View>
  );
}
