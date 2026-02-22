import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
    <View className="flex-1 justify-end bg-black/40">
      {isVisible && (
       <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="overflow-hidden bg-[#F6F8F7]"
          style={{
            height: "90%",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }}
        >

  {/* ---------- HEADER ---------- */}
  <View className="relative pb-6 pt-2">
     <LinearGradient colors={["#EAF6F1", "#F6F8F7"]} className="absolute top-0 left-0 right-0 h-full" />

    {/* Handle */}
    <View className="items-center pt-3 pb-4">
      <View className="h-1.5 w-12 rounded-full bg-gray-300/80" />
    </View>

    {/* Close Button */}
    <Pressable
      onPress={handleClose}
      className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/70 items-center justify-center"
    >
      <MaterialIcons name="close" size={22} color="#374151" />
    </Pressable>

    {/* Title */}
    <View className="items-center px-6 mt-2">
      <Text className="text-3xl text-gray-900 mb-2 font-bold">
        Sessions & Usage
      </Text>

      <Text className="text-base text-gray-600 text-center max-w-xs">
        Track your conversations and activity insights.
      </Text>
    </View>
  </View>

  {/* ---------- CONTENT ---------- */}
  <View className="flex-1 items-center justify-center px-8">
    <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
      <Ionicons name="hourglass-outline" size={56} color="#9CA3AF" />
      <Text className="text-lg font-semibold text-[#111827] mt-4">
        Coming Soon
      </Text>
      <Text className="text-sm text-[#4B5563] mt-2 text-center leading-5">
        Session history and usage insights are on the way.
        For now, just enjoy uninterrupted conversations ✨
      </Text>
    </View>
  </View>

</Animated.View>
      )}
    </View>
  );
}