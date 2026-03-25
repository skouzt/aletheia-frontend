import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

type PlanType = "clarity" | "insight";

const PLAN_CONFIG: Record<
  PlanType,
  {
    name: string;
    price: string;
    dailyMinutes: string;
    description: string;
    features: string[];
  }
> = {
  clarity: {
    name: "Clarity",
    price: "$14",
    dailyMinutes: "40 min × 10 sessions",
    description:
      "A balanced option for building a consistent monthly reflection habit.",
    features: [
      "10 monthly conversation sessions",
      "40-minute sessions",
      "Session summaries after every session",
    ],
  },
  insight: {
    name: "Insight",
    price: "$19",
    dailyMinutes: "40 min × 15 sessions",
    description:
      "More room each month for regular check-ins and deeper conversations.",
    features: [
      "15 monthly conversation sessions",
      "40-minute sessions",
      "Session summaries after every session",
    ],
  },
};

const formatStatusLabel = (status: string) => {
  if (status === "none") {
    return "Current";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function ManageSubscription() {
  const router = useRouter();
  const subscription = useSubscription();
  const { user } = useUser();

  const plan = subscription.plan;
  const status = String(subscription.status ?? "none");

  const currentPlan = plan === "clarity" || plan === "insight" ? plan : null;
  const currentPlanConfig = currentPlan ? PLAN_CONFIG[currentPlan] : null;
  const isTrial = status === "trial";
  const statusLabel = currentPlan
    ? isTrial
      ? "Trial"
      : formatStatusLabel(status)
    : "No plan";

  const accessLabel =
    currentPlanConfig?.dailyMinutes ?? "Choose a plan to unlock monthly access";

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Signed-in account";

  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 350);
  };

  const handlePrimaryAction = () => {
    if (currentPlan) {
      router.push("/(subscription)/changeplan");
      return;
    }

    router.push("/(subscription)/plans");
  };

  useEffect(() => {
    subscription.refresh().catch(() => {});
  }, []);

  const handleManageBilling = () => {
    Alert.alert(
      "Billing Management",
      "Billing is handled through Dodo Payments. A customer billing portal link is not wired up in the app yet."
    );
  };

  const handleCancelSubscription = () => {
    if (isTrial) return;

    Alert.alert(
      "Cancel Subscription",
      "Cancellation is handled through Dodo Payments. A customer billing portal link is not wired up in the app yet."
    );
  };

  useEffect(() => {
    return () => setIsVisible(false);
  }, []);

  return (
    <View className="flex-1 justify-end bg-[#0E1513]/55">
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
            contentContainerStyle={{ paddingBottom: 26 }}
          >
            <View className="relative">
              <LinearGradient
                colors={["#FFE7AA", "#F8F1DD", "#F5F8F6"]}
                locations={[0, 0.56, 1]}
                className="absolute left-0 right-0 top-0 h-[280px]"
              />

              <View className="items-center pt-3">
                <View className="h-1.5 w-14 rounded-full bg-[#101816]/12" />
              </View>

              <View className="flex-row items-center justify-between px-5 pt-4">
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  className="h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/85"
                >
                  <Ionicons name="arrow-back" size={20} color="#101816" />
                </Pressable>

                <View className="rounded-full bg-[#101816]/6 px-3 py-1.5">
                  <Text className="text-[10px] font-semibold uppercase tracking-[1.3px] text-[#4F6A5F]">
                    Account
                  </Text>
                </View>

                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  className="h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/85"
                >
                  <Ionicons name="close" size={20} color="#101816" />
                </Pressable>
              </View>

              <View className="px-6 pb-5 pt-5">
                <Text className="text-xs font-semibold uppercase tracking-[2px] text-[#568170]">
                  Membership
                </Text>
                <Text className="mt-2 text-[30px] font-bold leading-[36px] text-[#101816]">
                  {currentPlanConfig
                    ? "Manage your membership"
                    : "No active membership"}
                </Text>
                <Text className="mt-3 text-sm leading-6 text-[#5D6E67]">
                  {currentPlanConfig
                    ? "Review your current plan, billing details, and next actions in one place."
                    : "Choose a plan to unlock monthly sessions and access your billing controls."}
                </Text>

              </View>
            </View>

            {currentPlanConfig ? (
              <View className="mx-5 overflow-hidden rounded-[26px] border border-[#DDE7E2] bg-white">
                <LinearGradient
                  colors={
                    currentPlan === "insight"
                      ? ["rgba(255,211,106,0.18)", "rgba(255,255,255,0)"]
                      : ["rgba(1,152,99,0.12)", "rgba(255,255,255,0)"]
                  }
                  className="absolute left-0 right-0 top-0 h-32"
                />

                <View className="p-5">
                  <View>
                    <View className="mb-3 flex-row items-center gap-3">
                      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#019863]/10">
                        <Ionicons
                          name={
                            currentPlan === "insight"
                              ? "sparkles-outline"
                              : "leaf-outline"
                          }
                          size={22}
                          color="#019863"
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#5A7B70]">
                          Active plan
                        </Text>
                        <Text className="mt-1 text-[24px] font-bold text-[#101816]">
                          {currentPlanConfig.name}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm leading-6 text-[#5D6E67]">
                      {currentPlanConfig.description}
                    </Text>
                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">
                    <MetaPill text={accessLabel} />
                    <MetaPill text="Dodo checkout" />
                  </View>

                  <View className="my-4 h-px bg-[#E6EEEA]" />

                  <View className="gap-3">
                    {currentPlanConfig.features.map((feature) => (
                      <Feature key={feature} text={feature} />
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mx-5 overflow-hidden rounded-[26px] border border-[#DDE7E2] bg-white">
                <LinearGradient
                  colors={["rgba(1,152,99,0.14)", "rgba(255,255,255,0)"]}
                  className="absolute left-0 right-0 top-0 h-24"
                />
                <View className="p-6">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#019863]/10">
                    <Ionicons name="card-outline" size={22} color="#019863" />
                  </View>
                  <Text className="mt-4 text-[24px] font-bold text-[#101816]">
                    No plan is active right now
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-[#5D6E67]">
                    Choose a plan to start monthly conversations, session
                    summaries, and billing management.
                  </Text>
                </View>
              </View>
            )}

            <View className="mx-5 mt-4 overflow-hidden rounded-[22px] border border-[#DDE7E2] bg-white">
              <LinearGradient
                colors={["rgba(15,23,42,0.04)", "rgba(255,255,255,0)"]}
                className="absolute left-0 right-0 top-0 h-20"
              />

              <View className="p-5">
                <View className="mb-4 flex-row items-center gap-2">
                  <Ionicons name="receipt-outline" size={18} color="#64748b" />
                  <Text className="text-lg font-bold text-[#101816]">
                    Billing details
                  </Text>
                </View>

                <View className="rounded-2xl border border-[#E4ECE8] bg-[#FAFCFB] px-4 py-1">
                  <DetailRow label="Account email" value={email} />
                  <DetailRow
                    label="Payment method"
                    value={currentPlanConfig ? "Dodo Payments" : "Not set"}
                  />
                  <DetailRow label="Status" value={statusLabel} />
                  <DetailRow
                    label="Plan"
                    value={currentPlanConfig ? currentPlanConfig.name : "None"}
                  />
                  <DetailRow label="Access" value={accessLabel} isLast />
                </View>
              </View>
            </View>

            <View className="mx-5 mt-4 rounded-[24px] border border-[#DDE7E2] bg-white p-4">
              <Pressable
                className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#019863]"
                onPress={handlePrimaryAction}
              >
                <Text className="text-base font-semibold text-white">
                  {currentPlanConfig ? "Change Plan" : "Choose Plan"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </Pressable>

              {currentPlanConfig && (
                <Pressable
                  className="mt-3 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-[#019863]/20 bg-white"
                  onPress={handleManageBilling}
                >
                  <Text className="font-semibold text-[#101816]">
                    Manage Billing
                  </Text>
                  <Ionicons name="open-outline" size={16} color="#101816" />
                </Pressable>
              )}

              {currentPlanConfig ? (
                <Pressable
                  className="mt-4 items-center"
                  disabled={isTrial}
                  onPress={handleCancelSubscription}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isTrial ? "text-slate-400" : "text-red-500"
                    }`}
                  >
                    Cancel Subscription
                  </Text>
                </Pressable>
              ) : (
                <Text className="mt-4 text-center text-xs leading-5 text-[#6B7280]">
                  Billing controls will appear here after you subscribe.
                </Text>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between gap-4 py-3 ${
        isLast ? "" : "border-b border-[#E4ECE8]"
      }`}
    >
      <Text className="flex-1 text-sm font-medium text-[#60716B]">{label}</Text>
      <Text className="max-w-[55%] text-right text-sm font-semibold text-[#101816]">
        {value}
      </Text>
    </View>
  );
}

function MetaPill({ text }: { text: string }) {
  return (
    <View className="rounded-full border border-[#DCE6E1] bg-[#F7FAF8] px-3 py-2">
      <Text className="text-xs font-semibold text-[#40524B]">{text}</Text>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full border border-[#BEE4D4] bg-[#EAF6F1]">
        <Ionicons name="checkmark" size={14} color="#019863" />
      </View>
      <Text className="flex-1 text-sm leading-6 text-[#4F625B]">{text}</Text>
    </View>
  );
}
