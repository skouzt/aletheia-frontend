import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import LottieView from "lottie-react-native";
import stressManagementAnimation from "@/assets/images/Stress Management.lottie";
import {
  Image,
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

const DAILY_LIMIT_MINUTES = 40;

export default function UsageLimitScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const stressAnimationUri = Image.resolveAssetSource(
    stressManagementAnimation
  ).uri;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => router.back(), 320);
  };

  return (
    <View className="flex-1 justify-end bg-black/45">
      {visible && (
        <Animated.View
          entering={SlideInDown.duration(420).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="overflow-hidden rounded-t-[34px] bg-[#F3F6F4]"
          style={{ height: "90%" }}
        >
          <LinearGradient
            colors={["#EAF4EE", "#F3F6F4"]}
            className="absolute left-0 right-0 top-0 h-64"
          />

          <View className="items-center pb-2 pt-4">
            <View className="h-1.5 w-12 rounded-full bg-[#D6D8D7]" />
          </View>

          <View className="flex-row justify-end px-5 pb-1">
            <Pressable
              onPress={handleDismiss}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/80"
            >
              <Ionicons name="close" size={20} color="#5E6360" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            <View className="px-6 pt-2">
              <View className="overflow-hidden rounded-[30px] border border-[#E0E6E2] bg-white">
                <LinearGradient
                  colors={["#EAF7EF", "#F7FAF8"]}
                  className="absolute bottom-0 left-0 right-0 top-0"
                />
                <LottieView
                  source={{ uri: stressAnimationUri }}
                  autoPlay
                  loop
                  style={{ height: 248, width: "100%" }}
                />
                <LinearGradient
                  colors={["rgba(247,250,248,0)", "rgba(247,250,248,0.98)"]}
                  className="absolute bottom-0 left-0 right-0 h-24"
                />
              </View>
            </View>

            <View className="items-center px-8 pt-5">
              <View className="rounded-full border border-[#D8E9DF] bg-[#F0F8F4] px-4 py-2">
                <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-[#0F9C63]">
                  Daily limit reached
                </Text>
              </View>

              <Text className="mt-4 text-center text-[34px] leading-[40px] text-[#1F2321]">
                Time for a Mindful Reset
              </Text>

              <Text className="mt-4 max-w-[320px] text-center text-base leading-7 text-[#5C615D]">
                You gave yourself {DAILY_LIMIT_MINUTES} focused minutes today.
                Great consistency. Pause here, breathe, and return tomorrow with
                a fresh mind.
              </Text>

              <View className="mt-9 w-full rounded-2xl border border-[#E6ECE8] bg-white p-6 shadow-sm">
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-[#626664]">
                    Daily Reflection
                  </Text>
                  <Text className="text-sm font-semibold text-[#019863]">
                    {DAILY_LIMIT_MINUTES} of {DAILY_LIMIT_MINUTES} mins used
                    today
                  </Text>
                </View>

                <View className="h-3 overflow-hidden rounded-full bg-[#E9EFEB]">
                  <View className="h-3 w-full rounded-full bg-[#0F9C63]" />
                </View>

                <View className="mt-4 flex-row items-center justify-center gap-1.5">
                  <Ionicons name="checkmark-circle" size={16} color="#0F9C63" />
                  <Text className="text-xs font-semibold uppercase tracking-[1.3px] text-[#019863]">
                    Limit reached for today
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleDismiss}
                className="mt-8 h-14 w-full items-center justify-center rounded-full bg-[#0F9C63] shadow-sm active:scale-[0.98]"
              >
                <Text className="text-lg font-semibold text-white">
                  Continue Tomorrow
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
