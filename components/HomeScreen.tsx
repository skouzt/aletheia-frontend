import { useSubscription } from "@/hooks/useSubscription";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router'; // ✅ ADDED
import React, { useCallback, useEffect, useMemo } from 'react';
import { Image, Pressable, StatusBar, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LiquidWaveVoiceButton } from './AnimatedVoiceButton';




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
  "Peace starts here.\nWhat's bothering you?"
];

export default function HomeScreen() {
  const greeting = useMemo(() => {
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  }, []);



  const { plan, loading, refresh } = useSubscription();

  // ✅ Refresh subscription when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Home screen focused, refreshing subscription...");
      refresh();
    }, [refresh])
  );

  const hasActiveSubscription =
    !loading && (plan === "guided" || plan === "extended");

  const handleStartSession = () => {
  if (loading) {
    console.log("Subscription still loading, ignoring press");
    return;
  }

  if (!hasActiveSubscription) {
    router.push("/(modal)/paywall");
    return;
  }

  // ✅ ADD: Actually navigate to the session screen
  console.log("Starting session with plan:", plan);
  router.push("/(modal)"); 
};
  // Animations
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);

  useEffect(() => {
    textOpacity.value = withDelay(300, withTiming(1, { duration: 1000 }));
    textTranslateY.value = withDelay(300, withTiming(0, { duration: 1000 }));
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View className="flex-1">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']}
        className="absolute inset-0"
      />

      <SafeAreaView className="flex-1" edges={['top']}>

        {/* Header */}
        <View className="items-center mt-8">
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 280, height: 100 }}
            resizeMode="contain"
          />
        </View>

        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-10">

          {/* Greeting */}
          <Animated.View
            style={[{ width: '100%', alignItems: 'center' }, animatedTextStyle]}
          >
            <View className="mb-14">
              <Text
                className="text-center text-2xl text-slate-800 leading-tight"
                style={{ fontFamily: 'LibreCaslonText-Bold' }}
              >
                {greeting}
              </Text>
            </View>
          </Animated.View>

          {/* 🔘 TAP TARGET (IMPORTANT CHANGE) */}
          <Pressable onPress={handleStartSession}>

            <View
              style={{
                shadowColor: "#6EE7B7",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 15,
              }}
            >
              <LiquidWaveVoiceButton onPress={handleStartSession}/>
            </View>

          </Pressable>

          {/* Instruction */}
          <Animated.View style={[animatedTextStyle, { marginTop: 60 }]}>
            <Text className="text-slate-400 text-xs tracking-widest uppercase">
              Tap to start session
            </Text>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}
