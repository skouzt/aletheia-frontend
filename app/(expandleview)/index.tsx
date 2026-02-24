import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const INTENSITY_MAP = [
  { label: 'Too much', bg: '#FEE2E2', text: '#B91C1C' },
  { label: 'Anxious', bg: '#FFEDD5', text: '#C2410C' },
  { label: 'Overwhelmed', bg: '#FFEDD5', text: '#C2410C' },
  { label: 'Strained', bg: '#FEF9C3', text: '#A16207' },
  { label: 'Heavy', bg: '#FEF9C3', text: '#A16207' },
  { label: 'Uneasy', bg: '#FEF9C3', text: '#A16207' },
  { label: 'Neutral', bg: '#D1FAE5', text: '#065F46' },
  { label: 'Light', bg: '#D1FAE5', text: '#065F46' },
  { label: 'Okay', bg: '#D1FAE5', text: '#065F46' },
  { label: 'At ease', bg: '#D1FAE5', text: '#065F46' },
];

function getEmotionInfo(intensity: any) {
  try {
    const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 7)));
    const map = INTENSITY_MAP[value - 1] || INTENSITY_MAP[6];
    return { label: map.label, bg: map.bg, text: map.text, value };
  } catch {
    return { label: 'Neutral', bg: '#D1FAE5', text: '#065F46', value: 7 };
  }
}

export default function ExpandViewScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const { date, summary, intensity } = useLocalSearchParams<{
    date?: string;
    summary?: string;
    intensity?: string;
  }>();

  const intensityValue = Math.min(Math.max(Number(intensity || 0), 0), 10);
  const emotion = getEmotionInfo(intensity); // ✅ dynamic emotion

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 550);
  };

  return (
    <View className="flex-1 bg-white">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(600).delay(50)}
          exiting={SlideOutDown.duration(500).easing(Easing.in(Easing.ease))}
          className="rounded-t-[28px] overflow-hidden"
          style={{ height: "92%" }}
        >
          <LinearGradient
            colors={["#EAF6F1", "#F6F8F7", "#FFFFFF"]}
            locations={[0, 0.55, 1]}
            className="flex-1"
          >
            <SafeAreaView className="flex-1">
              <View className="px-5 pt-6 pb-4 flex-row justify-between items-start">
                <View>
                  <Text
                    className="text-[28px] leading-tight text-[#0F172A]"
                    style={{ fontFamily: "LibreCaslonText-Bold" }}
                  >
                    Session{"\n"}Summary
                  </Text>
                  <Text className="text-sm text-[#019863] mt-1">
                    {date ? format(new Date(date), "MMMM d, yyyy • h:mm a") : ""}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
                >
                  <Ionicons name="close" size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                className="px-5"
              >
                {/* Emotional State */}
                <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text
                      className="text-lg"
                      style={{ fontFamily: "LibreCaslonText-Bold" }}
                    >
                      Emotional State
                    </Text>

                    {/* ✅ dynamic badge */}
                    <Text
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: emotion.bg, color: emotion.text }}
                    >
                      {emotion.label.toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-gray-500">Intensity</Text>
                      <Text className="text-sm font-bold text-[#019863]">
                        {intensityValue}/10
                      </Text>
                    </View>

                    <View className="flex-row gap-1">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <View
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < intensityValue ? "bg-[#019863]" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                {/* What We Discussed */}
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <View className="w-2 h-2 bg-[#019863] rounded-full mr-2" />
                    <Text
                      className="text-lg flex-1"
                      style={{ fontFamily: "LibreCaslonText-Bold" }}
                    >
                      What We Discussed
                    </Text>
                  </View>

                  <View className="bg-white rounded-xl p-4">
                    <Text className="text-[15px] text-gray-600 leading-relaxed">
                      {summary
                        ? decodeURIComponent(summary) // ✅ decode the encoded summary
                        : "Detailed summary will be available soon."}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}