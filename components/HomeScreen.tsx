import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Image, Pressable, StatusBar, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LiquidWaveVoiceButton } from "./AnimatedVoiceButton";

const GREETINGS = [
  "Hi. Take a deep breath.\nLet's talk it through.",
  "I'm listening.\nWhat's on your mind today?",
  "Pause for a moment.\nHow are you really feeling?",
  "Take your time.\nI'm here to walk with you.",
  "Let it all out.\nThis is a safe space.",
  "Take a slow breath in.\nReady to share?",
  "A new moment.\nA new chance to talk.",
  "Softly now.\nTell me what's happening.",
  "Center yourself.\nI'm ready when you are.",
  "Peace starts here.\nWhat's bothering you?",
];

export default function HomeScreen() {
  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    []
  );


  



  const handleStartSession = () => {
    router.push("/(modal)");
  };

  /* ───────────────── Animations ───────────────── */

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

  /* ───────────────── UI ───────────────── */

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
  colors={["#FAFBFC", "#EDF1F4", "#DCE3EA"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  className="absolute inset-0"
/>


      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* ───────── Header ───────── */}
        <Animated.View
          style={animatedHeaderStyle}
          className="items-center pt-6 pb-4"
        >
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: 220, height: 100 }}
            resizeMode="contain"
          />

        
        </Animated.View>

        {/* ───────── Main Content ───────── */}
        <View className="flex-1 items-center justify-center px-8">
          {/* Greeting */}
          <Animated.View style={[animatedTextStyle, { alignItems: "center" }]}>
            <Text
              className="text-center text-2xl text-slate-800 leading-snug"
              style={{ fontFamily: "LibreCaslonText-Bold" }}
            >
              {greeting}
            </Text>
          </Animated.View>

          {/* Orb */}
          <View className="mt-10">
            <Pressable onPress={handleStartSession}>
              <View
                style={{
                  shadowColor: "#6EE7B7",
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.25,
                  shadowRadius: 18,
                }}
              >
                <LiquidWaveVoiceButton onPress={handleStartSession} />
              </View>
            </Pressable>
          </View>

          {/* Instruction */}
          <Animated.View
            style={[animatedHintStyle, { marginTop: 24 }]}
          >
            <Text className="text-slate-400 text-xs tracking-widest uppercase">
              Begin when you’re ready
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
