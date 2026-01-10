import { useSubscription } from "@/hooks/useSubscription";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

export default function ManageSubscription() {
  const router = useRouter();

  const { plan, status, expiresAt } = useSubscription();

  const isGuided = plan === "guided";
  const isTrial = status === "active" && !expiresAt;

  const { user } = useUser();

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Animated.View
        entering={SlideInDown.duration(400)}
        exiting={SlideOutDown.duration(300)}
        className="rounded-t-[32px] bg-[#F6F8F7]"
        style={{ height: "95%" }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-6 pb-4">
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} />
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)/home")}>
            <Ionicons name="close" size={24} />
          </Pressable>
        </View>

        {/* Title */}
        <View className="px-6 pb-6">
          <Text className="text-3xl font-serif font-bold text-center">
            Manage Subscription
          </Text>
          <Text className="text-slate-500 text-center mt-1">
            Control your Aletheia journey
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Plan Card */}
          <View className="mx-6 bg-white rounded-2xl p-6 mb-5">
            <View className="flex-row justify-between items-start mb-6">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-green-100 items-center justify-center">
                  <Ionicons name="leaf-outline" size={22} color="#019863" />
                </View>
                <View>
                  <Text className="text-xl font-serif font-bold">
                    {isGuided ? "Guided Plan" : "Extended Plan"}
                  </Text>
                  <Text className="text-slate-500 text-sm">
                    {email ?? "Signed in via Gumroad"}
                  </Text>
                </View>
              </View>

              {/* Status / Trial badge */}
              <View
                className={`px-3 py-1.5 rounded-full flex-row items-center gap-2 ${
                  isTrial ? "bg-yellow-100" : "bg-green-100"
                }`}
              >
                <View
                  className={`h-2 w-2 rounded-full ${
                    isTrial ? "bg-yellow-500" : "bg-green-600"
                  }`}
                />
                <Text
                  className={`text-xs font-bold uppercase ${
                    isTrial ? "text-yellow-700" : "text-green-700"
                  }`}
                >
                  {isTrial ? "Trial" : "Active"}
                </Text>
              </View>
            </View>

            <Text className="text-4xl font-serif font-bold text-[#019863]">
              {isGuided ? "60" : "480"} minutes
            </Text>
            <Text className="text-slate-400 mb-6">
              per day allowance
            </Text>

            <View className="h-px bg-slate-100 mb-4" />

            <View className="flex-row justify-between items-end">
              <Text className="text-slate-500">Current cost</Text>
              <Text className="font-serif font-bold text-xl">
                {isGuided ? "$15" : "$50"}
                <Text className="text-slate-500 text-sm"> / month</Text>
              </Text>
            </View>
          </View>

          {/* Billing Details */}
          <View className="mx-6 bg-white rounded-2xl p-6 mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="receipt-outline" size={18} color="#64748b" />
              <Text className="font-serif font-bold text-lg">
                Billing Details
              </Text>
            </View>

            <DetailRow label="Payment method" value="Gumroad" />
            <DetailRow label="Status" value={isTrial ? "Trial" : "Active"} />
          </View>

          {/* Actions */}
          <View className="px-6 gap-3">
            <Pressable
              className="h-14 rounded-xl bg-[#019863] items-center justify-center"
              onPress={() => router.push("/(subscription)/changeplan")}
            >
              <Text className="text-white font-semibold">
                Change Plan
              </Text>
            </Pressable>

            <Pressable
              className="h-14 rounded-xl border border-slate-200 items-center justify-center flex-row gap-2"
              onPress={() => Linking.openURL("https://gumroad.com/library")}
            >
              <Text className="font-semibold">
                Manage Billing
              </Text>
              <Ionicons name="open-outline" size={16} />
            </Pressable>

            {/* Cancel – disabled during trial */}
            <Pressable
              className="mt-4 items-center"
              disabled={isTrial}
              onPress={() => Linking.openURL("https://gumroad.com/library")}
            >
              <Text
                className={`text-sm font-medium ${
                  isTrial
                    ? "text-slate-400"
                    : "text-red-500"
                }`}
              >
                Cancel Subscription
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="font-semibold text-sm">{value}</Text>
    </View>
  );
}
