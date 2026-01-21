import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import FluidOrb from "./FluidSphere";

interface LiquidWaveVoiceButtonProps {
  onPress?: () => void;
}

export const LiquidWaveVoiceButton: React.FC<LiquidWaveVoiceButtonProps> = ({
  onPress,
}) => {

  /* -------- Press feedback -------- */
  const pressScale = useSharedValue(1);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pressScale.value = withTiming(0.94, { duration: 120 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  /* -------- Gentle floating (HTML-equivalent) -------- */
  const floatY = useSharedValue(0);
  const floatScale = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    floatScale.value = withRepeat(
      withTiming(1.01, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: floatScale.value },
    ],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      {/* Floating layer */}
      <Animated.View style={floatingStyle}>
        {/* Press feedback layer */}
        <Animated.View style={pressStyle}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.container}
          >
            {/* Fluid orb */}
            <FluidOrb
              size={280}
              speed={0.55}   // calm internal motion
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

LiquidWaveVoiceButton.displayName = "LiquidWaveVoiceButton";

/* -------- Styles -------- */

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",

    /* Soft glow shadow (matches HTML vibe) */
    shadowColor: "#2DD4BF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
});
