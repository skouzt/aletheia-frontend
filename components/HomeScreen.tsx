import { useTabTransition } from "@/context/tab-transition";
import { useSessionLimit } from "@/hooks/useSessionLimit";
import { useSubscription } from "@/hooks/useSubscription";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StatusBar, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LiquidWaveVoiceButton } from "./AnimatedVoiceButton";

const GREETINGS = [
  "Come as you are.\nHe is listening.",
  "Lay your burdens down.\nSpeak freely.",
  "You are not alone.\nHe hears your heart.",
  "Take a quiet moment.\nShare what’s within.",
  "Bring it to Him.\nThere is grace here.",
  "Speak without fear.\nYou are understood.",
  "Whatever you carry,\nplace it before Him.",
  "In His presence,\nthere is peace.",
  "Open your heart.\nYou are heard.",
  "Let it out.\nGrace meets you here.",
];

export default function HomeScreen() {
  const { onSlideComplete } = useTabTransition();
  const { check, loading } = useSessionLimit();
  const subscription = useSubscription();

  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    []
  );

  const [orbPaused, setOrbPaused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setOrbPaused(true);

      onSlideComplete.current = () => {
        setOrbPaused(false);
        onSlideComplete.current = null;
      };

      return () => {
        onSlideComplete.current = null;
        setOrbPaused(true);
      };
    }, [])
  );

const handleStartSession = async () => {
  if (loading) return;

  const usage = await check();
  if (!usage) return;

  if (usage.reason === "limit_reached") {
    router.push("/usage");
    return;
  }

  if (!usage.allowed) {
    router.push("/paywall");
    return;
  }

  router.push("/(modal)");
};

  /* ───────── Animations ───────── */

  const headerOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const hintOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });

    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 900 })
    );

    textTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 900 })
    );

    hintOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 800 })
    );
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const animatedHintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  return (
   <View style={{ flex: 1 }}>
  <StatusBar barStyle="dark-content" />

      <LinearGradient
      colors={["#F1F5F9", "#E2E8F0", "#CBD5E1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <Animated.View
          style={animatedHeaderStyle}
          className="items-center pt-6 pb-4"
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: "LibreCaslonText-Bold",
              color: "#0F172A",
              letterSpacing: 1.5,
            }}
          >
            Lily
          </Text>
        </Animated.View>

        <View className="flex-1 items-center justify-center px-8">
          <Animated.View style={[animatedTextStyle, { alignItems: "center" }]}>
            <Text
              className="text-center text-2xl text-slate-800 leading-snug"
              style={{ fontFamily: "LibreCaslonText-Bold" }}
            >
              {greeting}
            </Text>
          </Animated.View>

          <View className="mt-10">
            <View
              style={{
                shadowColor: "#6EE7B7",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.25,
                shadowRadius: 18,
              }}
            >
              <LiquidWaveVoiceButton
                disabled={subscription.loading} // ✅ PERFECT
                onPress={handleStartSession}
                paused={orbPaused}
              />
            </View>
          </View>

          <Animated.View style={[animatedHintStyle, { marginTop: 24 }]}>
            <Text className="text-slate-400 text-xs tracking-widest uppercase">
              Speak when your heart is ready
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}