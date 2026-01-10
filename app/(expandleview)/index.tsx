import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    SlideInDown,
    SlideOutDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExpandViewScreen() {
  const router = useRouter();
  const { date, summary, intensity } = useLocalSearchParams<{
    date?: string;
    summary?: string;
    intensity?: string;
  }>();

  const intensityValue = Math.min(
    Math.max(Number(intensity || 0), 0),
    10
  );

  return (
    <View className="flex-1 justify-end bg-black/40">
      {/* Modal container */}
      <Animated.View
        entering={SlideInDown.duration(400)}
        exiting={SlideOutDown.duration(250)}
        className="rounded-t-[28px] overflow-hidden"
        style={{ height: "92%" }}
      >
        {/* FULL gradient background */}
        <LinearGradient
          colors={["#EAF6F1", "#F6F8F7", "#FFFFFF"]}
          locations={[0, 0.55, 1]}
          className="flex-1"
        >
          <SafeAreaView className="flex-1">
            {/* Drag handle */}
            <View className="items-center py-2">
              <View className="h-1.5 w-12 rounded-full bg-gray-300" />
            </View>

            {/* Header */}
            <View className="px-5 pt-2 pb-4 flex-row justify-between items-start">
              <View>
                <Text
                  className="text-[28px] leading-tight text-[#0F172A]"
                  style={{ fontFamily: "LibreCaslonText-Bold" }}
                >
                  Session{"\n"}Summary
                </Text>
                <Text className="text-sm text-[#019863] mt-1">
                  {date
                    ? format(
                        new Date(date),
                        "MMMM d, yyyy • h:mm a"
                      )
                    : ""}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.back()}
                className="w-9 h-9 rounded-full bg-black/5 items-center justify-center"
              >
                <Ionicons name="close" size={20} />
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              className="px-5"
            >
              {/* Pills */}
              <View className="flex-row gap-2 mb-5">
                <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-white">
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#019863"
                  />
                  <Text className="text-xs font-semibold">
                    45 minutes
                  </Text>
                </View>

                <View className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-[#D1FAE5]">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#019863"
                  />
                  <Text className="text-xs font-semibold text-[#019863]">
                    Completed
                  </Text>
                </View>
              </View>

              {/* Emotional State */}
              <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "LibreCaslonText-Bold" }}
                  >
                    Emotional State
                  </Text>
                  <Text className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                    ANXIOUS
                  </Text>
                </View>

                <View className="flex-row items-center gap-4">
                  <Text style={{ fontSize: 30 }}>😥 😟</Text>

                  <View className="flex-1">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-gray-500">
                        Intensity
                      </Text>
                      <Text className="text-sm font-bold text-[#019863]">
                        {intensityValue}/10
                      </Text>
                    </View>

                    <View className="flex-row gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <View
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < intensityValue
                              ? "bg-[#019863]"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* What We Discussed */}
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-2 h-2 bg-[#019863] rounded-full" />
                  <Text
                    className="text-lg"
                    style={{ fontFamily: "LibreCaslonText-Bold" }}
                  >
                    What We Discussed
                  </Text>
                </View>

                <View className="bg-white rounded-xl p-4">
                  <Text className="text-[15px] text-gray-600 leading-relaxed">
                    {summary ||
                      "Detailed summary will be available soon."}
                  </Text>

                  <TouchableOpacity className="mt-2">
                    <Text className="text-sm font-semibold text-[#019863]">
                      Read more ⌄
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
