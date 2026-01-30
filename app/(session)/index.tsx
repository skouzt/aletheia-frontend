import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

export default function SessionsUsageScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 450);
  };

  return (
    <View className="flex-1 justify-end bg-transparent">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(500).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(400).easing(Easing.in(Easing.ease))}
          className="rounded-t-3xl overflow-hidden"
          style={{ height: "92%" }}
        >
          <LinearGradient
            colors={["#EAF6F1", "#F6F8F7"]}
            className="absolute top-0 left-0 right-0 h-full"
          >
            {/* Handle */}
            <View className="w-full flex items-center pt-3 pb-1">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-start">
              <View>
                <Text className="text-2xl font-bold text-[#111827]">
                  Sessions & Usage
                </Text>
                <Text className="text-sm text-[#4B5563] mt-1 font-medium">
                  Track your conversations over time
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Coming Soon Content */}
            <View className="flex-1 items-center justify-center px-8">
              <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
                <MaterialIcons
                  name="hourglass-empty"
                  size={56}
                  color="#9CA3AF"
                />
                <Text className="text-lg font-semibold text-[#111827] mt-4">
                  Coming Soon
                </Text>
                <Text className="text-sm text-[#4B5563] mt-2 text-center leading-5">
                  Session history and usage insights are on the way.
                  For now, just enjoy uninterrupted conversations ✨
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}
