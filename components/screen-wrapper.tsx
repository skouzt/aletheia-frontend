import { useTabTransition } from "@/context/tab-transition";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 280,
  mass: 0.7,
  overshootClamping: true,
} as const;

export function ScreenWrapper({ children }: { children: React.ReactNode }) {
  const { incomingOffset, onSlideComplete } = useTabTransition();
  const hasMounted = useRef(false);

  // PATH A — first paint:
  // Reads incomingOffset.value synchronously at construction.
  // The first frame this screen draws is already at ±offset, never at 0.
  const translateX = useSharedValue(incomingOffset.value);

  // PATH A continued — runs once after first paint.
  useEffect(() => {
    const onComplete = onSlideComplete.current;
    translateX.value = withSpring(0, SPRING_CONFIG, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
    incomingOffset.value = 0;
    hasMounted.current = true;
  }, []);

  // PATH B — every focus after the first mount.
  // The hasMounted guard avoids conflicting with PATH A on initial focus.
  useFocusEffect(
    useCallback(() => {
      if (!hasMounted.current) return;

      const onComplete = onSlideComplete.current;
      runOnUI(() => {
        "worklet";
        cancelAnimation(translateX);
        translateX.value = incomingOffset.value;
        translateX.value = withSpring(0, SPRING_CONFIG, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        });
        incomingOffset.value = 0;
      })();
    }, [])
  );

  const style = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
