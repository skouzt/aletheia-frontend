import { LilyFonts } from '@/constants/lily';
import React, { useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

const ART_HEIGHT = 300;
const DRIFT_MS = 9000;

/**
 * The strokes only occupy x 34–266 / y 22–272 of the 300×300 authoring canvas, so
 * cropping the viewBox to that bounding box — with preserveAspectRatio off — lets the
 * tangle stretch the full width of the screen instead of sitting in a 300px island.
 */
const ART_VIEWBOX = '34 22 232 250';

/**
 * The anxious-thoughts tangle: overlapping line-art loops with worries that drift
 * outward and dissolve. Transcribed from the Welcome screen in the design doc.
 */
const PATHS: { d: string; stroke: string; width: number }[] = [
  {
    d: 'M96 172c-24-8-38-30-30-52 9-24 42-30 62-16 15 11 12 34-4 40-14 5-27-7-22-20 4-10 18-12 24-4',
    stroke: 'rgba(233,245,238,0.20)',
    width: 1.5,
  },
  {
    d: 'M118 92c-30 4-52 26-50 56 2 34 36 56 70 50 30-6 50-32 44-60-5-25-32-40-54-30-19 9-24 36-8 48 13 10 32 2 33-13 1-11-9-20-19-16',
    stroke: 'rgba(233,245,238,0.26)',
    width: 1.6,
  },
  {
    d: 'M186 78c34 10 56 42 50 76-6 36-44 58-80 50-32-7-52-38-44-68 7-27 38-42 62-30 21 11 26 41 8 55-15 12-38 4-41-14-2-13 9-25 22-22',
    stroke: 'rgba(63,191,127,0.34)',
    width: 1.6,
  },
  {
    d: 'M74 118c-18 22-16 56 6 76 26 24 70 22 96-2 22-20 24-54 4-74',
    stroke: 'rgba(233,245,238,0.14)',
    width: 1.4,
  },
  {
    d: 'M210 128c22 18 26 52 8 74-20 26-60 32-88 18',
    stroke: 'rgba(233,245,238,0.12)',
    width: 1.4,
  },
  {
    d: 'M60 210c26 18 62 26 96 18s62-30 72-58',
    stroke: 'rgba(63,191,127,0.24)',
    width: 1.5,
  },
  {
    d: 'M148 46c-6-12 4-24 16-22M232 62c10-6 22 2 22 14M52 78c-10-4-18 6-14 17',
    stroke: 'rgba(233,245,238,0.18)',
    width: 1.4,
  },
  {
    d: 'M62 246c40 12 96 14 152-2',
    stroke: 'rgba(63,191,127,0.5)',
    width: 1.7,
  },
  { d: 'M84 268h140', stroke: 'rgba(63,191,127,0.28)', width: 1.5 },
];

/** Left offsets keep a small inset so chips never touch the screen bezel. */
const CHIPS = [
  { label: 'work never stops', left: '4%', top: '6%', dx: 83, dy: 87, delay: 0 },
  { label: 'am I enough?', left: '58%', top: '0%', dx: -46, dy: 101, delay: 1600 },
  { label: 'can’t sleep', left: '3%', top: '46%', dx: 87, dy: -5, delay: 3200 },
  { label: 'everyone’s moved on', left: '40%', top: '78%', dx: -14, dy: -78, delay: 4800 },
  { label: 'what if I fail', left: '62%', top: '38%', dx: -64, dy: 14, delay: 6400 },
];

function DriftChip({
  label,
  left,
  top,
  dx,
  dy,
  delay,
}: {
  label: string;
  left: string;
  top: string;
  dx: number;
  dy: number;
  delay: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: DRIFT_MS, easing: Easing.bezier(0.4, 0, 0.5, 1) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.68, 1], [0, 0.9, 0.5, 0]),
    transform: [
      { translateX: progress.value * dx },
      { translateY: progress.value * dy },
      { scale: 1 - progress.value * 0.45 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: left as never,
          top: top as never,
          paddingVertical: 5,
          paddingHorizontal: 11,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          backgroundColor: 'rgba(255,255,255,0.035)',
        },
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 11.5,
          letterSpacing: 0.1,
          fontFamily: LilyFonts.sans,
          color: 'rgba(233,245,238,0.62)',
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export function LilyWelcomeArt() {
  const { width } = useWindowDimensions();

  return (
    <View
      style={{
        width,
        height: ART_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={width}
        height={ART_HEIGHT}
        viewBox={ART_VIEWBOX}
        preserveAspectRatio="none"
        fill="none"
        style={{ position: 'absolute' }}
      >
        <G strokeLinecap="round" fill="none">
          {PATHS.map((p) => (
            <Path
              key={p.d}
              d={p.d}
              stroke={p.stroke}
              strokeWidth={p.width}
              // Keep line weight even once the paths are stretched horizontally.
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </G>
      </Svg>

      {CHIPS.map((c) => (
        <DriftChip key={c.label} {...c} />
      ))}
    </View>
  );
}

/** Soft radial wash behind the welcome content. RN has no radial CSS gradient. */
export function LilyGlow({
  width,
  height,
  color,
  opacity,
  stopAt = 0.68,
}: {
  width: number;
  height: number;
  color: string;
  opacity: number;
  stopAt?: number;
}) {
  const id = `glow-${width}-${height}-${Math.round(opacity * 100)}`;
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset={`${stopAt * 100}%`} stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
    </Svg>
  );
}
