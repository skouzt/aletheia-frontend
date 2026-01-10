import { useCall } from "@/context/CallContext";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";

export default function SessionsUsageScreen() {
  const router = useRouter();
  const {
    minutesUsed,
    minutesRemaining,
    dailyLimit,
    percentUsed,
    getCurrentSessionDuration,
    sessionHistory,
  } = useUsageTracking();
  const { isInCall } = useCall();

  // Live update current session duration
  const [currentDuration, setCurrentDuration] = useState(0);

  useEffect(() => {
    if (!isInCall) {
      setCurrentDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentDuration(getCurrentSessionDuration());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isInCall, getCurrentSessionDuration]);

  // Format date for display
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    // Format as "MMM DD"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatSessionTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Animated.View
        entering={SlideInDown.duration(500)}
        exiting={SlideOutDown.duration(400)}
        className="rounded-t-3xl overflow-hidden"
        style={{ height: "92%" }}
      >
        <LinearGradient colors={["#dcfce7", "#effdf4", "#ffffff"]} style={{ flex: 1 }}>
          {/* Handle Bar */}
          <View className="w-full flex items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="px-6 py-4 flex-row justify-between items-start">
            <View>
              <Text
                className="text-2xl font-bold text-[#111827]"
                style={{ fontFamily: "LibreCaslonText-Bold" }}
              >
                Sessions &amp; Usage
              </Text>
              <Text className="text-sm text-[#4B5563] mt-1 font-medium">
                Your daily conversation activity
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="text-gray-400 p-1 rounded-full active:bg-gray-100"
            >
              <MaterialIcons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1 px-6 pb-24"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 24 }}
          >
            {/* Active Session Card */}
            {isInCall && (
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-3">
                    <View className="relative h-3 w-3">
                      <View
                        className="absolute h-full w-full rounded-full bg-[#10b981] opacity-75"
                        style={{ transform: [{ scale: 1.5 }] }}
                      />
                      <View className="h-3 w-3 rounded-full bg-[#10b981]" />
                    </View>
                    <Text className="text-sm font-semibold uppercase tracking-wider text-[#10b981]">
                      Active Now
                    </Text>
                  </View>
                  <MaterialIcons name="mic" size={24} color="rgba(16, 185, 129, 0.4)" />
                </View>
                <Text
                  className="text-xl text-[#111827] mb-1"
                  style={{ fontFamily: "LibreCaslonText-Bold" }}
                >
                  Session active
                </Text>
                <Text className="text-[#4B5563]">{currentDuration} minutes so far</Text>
              </View>
            )}

            {/* Daily Allowance Card */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="bg-emerald-100 p-2 rounded-full">
                  <MaterialIcons name="timelapse" size={20} color="#10b981" />
                </View>
                <Text className="text-base font-semibold text-[#111827]">
                  Daily Allowance
                </Text>
              </View>

              <View className="flex-row justify-between items-end mb-2">
                <Text className="text-[#111827]">
                  <Text className="text-3xl" style={{ fontFamily: "LibreCaslonText-Bold" }}>
                    {minutesUsed}{" "}
                  </Text>
                  <Text className="text-lg text-[#4B5563]">of {dailyLimit} mins</Text>
                </Text>
                <Text className="text-xs text-[#4B5563] mb-1">Resets at midnight</Text>
              </View>

              <View className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <View
                  className="bg-[#10b981] h-2 rounded-full"
                  style={{ width: `${percentUsed}%` }}
                />
              </View>

              <Text className="text-xs text-[#4B5563] mt-3">
                You have {minutesRemaining} minutes remaining for today's sessions.
              </Text>
            </View>

            {/* Recent Sessions */}
            {sessionHistory.length > 0 && (
              <View>
                <Text
                  className="text-lg font-bold text-[#111827] mb-3 px-1"
                  style={{ fontFamily: "LibreCaslonText-Bold" }}
                >
                  Recent Sessions
                </Text>
                <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                  {sessionHistory.map((session, index) => (
                    <View key={session.id}>
                      {index > 0 && <View className="h-[1px] bg-gray-200" />}
                      <Pressable className="p-4 flex-row items-center justify-between active:bg-gray-50">
                        <View className="flex-row items-center gap-4">
                          <View className="bg-gray-100 p-2.5 rounded-full">
                            <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
                          </View>
                          <View>
                            <Text className="text-sm font-semibold text-[#111827]">
                              {formatSessionDate(session.date)}
                            </Text>
                            <Text className="text-xs text-[#4B5563]">
                              {formatSessionTime(session.startTime)}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm text-[#4B5563] font-medium">
                            {session.duration} min
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {sessionHistory.length === 0 && !isInCall && (
              <View className="bg-white rounded-2xl p-8 items-center">
                <MaterialIcons name="chat-bubble-outline" size={48} color="#D1D5DB" />
                <Text className="text-[#4B5563] mt-4 text-center">
                  No sessions yet. Start a conversation to see your history here.
                </Text>
              </View>
            )}

            {/* End Session Button */}
            {isInCall && (
              <View className="pt-2">
                <Pressable
                  onPress={() => router.back()}
                  className="w-full py-4 rounded-xl bg-white border border-gray-200 active:bg-gray-50"
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <MaterialIcons name="stop-circle" size={18} color="#374151" />
                    <Text className="text-[#374151] font-medium">End current session</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}