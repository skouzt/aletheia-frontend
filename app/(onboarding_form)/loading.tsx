import { LilyColors, LilyFonts } from '@/constants/lily';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

/** Breathing beat between finishing onboarding and landing in the conversation. */
const LoadingScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const subTextOpacity = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [loadingText, setLoadingText] = useState('Inhale…');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    ).start();

    const timer1 = setTimeout(() => {
      Animated.timing(textOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 1500);

    const timer2 = setTimeout(() => {
      setLoadingText('Exhale…');
      Animated.timing(textOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }, 2300);

    const timer3 = setTimeout(() => {
      Animated.timing(subTextOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    }, 3200);

    const timer4 = setTimeout(() => {
      router.replace('/(chat)');
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          opacity: fadeAnim,
        }}
      >
        {/* Breathing mint glow — the orb reduced to its essence */}
        <Animated.View
          style={{
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: 'rgba(63,191,127,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(63,191,127,0.22)',
            marginBottom: 56,
            transform: [
              { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            ],
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
          }}
        />

        <Animated.Text
          style={{
            opacity: textOpacity,
            fontFamily: LilyFonts.serif,
            fontSize: 34,
            textAlign: 'center',
            color: LilyColors.textPrimary,
            marginBottom: 8,
          }}
        >
          {loadingText}
        </Animated.Text>

        <Animated.Text
          style={{
            opacity: subTextOpacity,
            fontFamily: LilyFonts.sans,
            fontSize: 15,
            textAlign: 'center',
            color: LilyColors.textMuted,
          }}
        >
          Your space is loading.
        </Animated.Text>
      </Animated.View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 34, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: LilyFonts.sans,
            fontSize: 12,
            color: LilyColors.textFaint,
            textAlign: 'center',
          }}
        >
          Your experience is private and secure.
        </Text>
      </View>
    </View>
  );
};

export default LoadingScreen;
