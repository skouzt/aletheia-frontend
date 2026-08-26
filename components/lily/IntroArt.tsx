import { LilyColors, LilyFonts } from '@/constants/lily';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type EasingFunction,
  type EasingFunctionFactory,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The authoring canvas for every intro visual was 300×300. */
export const ART_SIZE = 300;

/**
 * Whether the art is on the page currently in view.
 *
 * All three intro pages are mounted at once so moving between them is a native
 * scroll rather than a screen mount — which is what makes it smooth — but that
 * would otherwise leave three screens' worth of loops burning frames off-screen.
 * Everything animated here idles until its page is the visible one.
 */
export const ArtActive = React.createContext(true);

/**
 * A looping 0→1 driver. Every intro animation in the design doc is an infinite CSS
 * keyframe, so they all reduce to one progress value plus interpolation.
 *
 * Restarting from 0 when the page comes back into view is deliberate: the scrawl
 * redraws itself rather than being caught mid-stroke.
 */
function useLoop(
  durationMs: number,
  delayMs = 0,
  easing: EasingFunction | EasingFunctionFactory = Easing.inOut(Easing.ease)
) {
  const active = React.useContext(ArtActive);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: durationMs, easing }), -1, false)
    );
    return () => cancelAnimation(progress);
  }, [active, progress, durationMs, delayMs, easing]);

  return progress;
}

/* ------------------------------------------------------------------ *
 * Shared pieces
 * ------------------------------------------------------------------ */

/**
 * `obPull` — a half-spoken fragment surfaces, then is drawn toward the centre and
 * dissolves. `to` is the offset it travels, matching the doc's --fx/--fy.
 */
export function DriftPhrase({
  children,
  to,
  position,
  fontSize = 16,
  duration = 10000,
  delay = 0,
}: {
  children: string;
  to: { x: number; y: number };
  position: { left?: number; right?: number; top?: number; bottom?: number };
  fontSize?: number;
  duration?: number;
  delay?: number;
}) {
  const p = useLoop(duration, delay);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.14, 0.55, 1], [0, 0.9, 0.62, 0]),
    transform: [
      { translateX: interpolate(p.value, [0, 1], [0, to.x]) },
      { translateY: interpolate(p.value, [0, 1], [0, to.y]) },
      { scale: interpolate(p.value, [0, 1], [1, 0.52]) },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute' }, position, style]} pointerEvents="none">
      <Text
        numberOfLines={1}
        style={{
          fontFamily: LilyFonts.serif,
          fontStyle: 'italic',
          fontSize,
          color: 'rgba(233,245,238,0.7)',
        }}
      >
        {children}
      </Text>
    </Animated.View>
  );
}

/** `obDust` — a mote falls in from the edge and is absorbed at the centre. */
function DustMote({
  from,
  size,
  color,
  delay,
}: {
  from: { x: number; y: number };
  size: number;
  color: string;
  delay: number;
}) {
  const p = useLoop(7000, delay, Easing.in(Easing.ease));

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25, 1], [0, 0.9, 0]),
    transform: [
      { translateX: interpolate(p.value, [0, 1], [from.x, 0]) },
      { translateY: interpolate(p.value, [0, 1], [from.y, 0]) },
      { scale: interpolate(p.value, [0, 1], [1, 0.2]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

const DUST: { from: { x: number; y: number }; size: number; color: string; delay: number }[] = [
  { from: { x: -104, y: -70 }, size: 2, color: '#9BEFC5', delay: 0 },
  { from: { x: 96, y: -84 }, size: 1.5, color: '#6FD3A2', delay: 900 },
  { from: { x: 112, y: 58 }, size: 2, color: '#9BEFC5', delay: 1900 },
  { from: { x: -78, y: 96 }, size: 1.5, color: '#57B98A', delay: 2800 },
  { from: { x: -126, y: 22 }, size: 2, color: '#9BEFC5', delay: 3700 },
  { from: { x: 30, y: 122 }, size: 1.5, color: '#6FD3A2', delay: 4600 },
  { from: { x: 62, y: -124 }, size: 2, color: '#57B98A', delay: 5500 },
];

/* ------------------------------------------------------------------ *
 * 00a — Listening
 * ------------------------------------------------------------------ */

/** The tangled scrawl of an unformed thought, drawn and then unwritten. */
const SCRAWL_D =
  'M2 78c22-2 44-3 62-2 4-16 16-26 30-24 10 2 14 12 10 20 14-10 30-32 44-40 12-7 22-2 22 12 0 20-20 44-40 56-14 8-30 8-40 0-12-9-12-26 0-36 10-8 26-10 38-4 16 8 26 26 24 42-2 18-18 30-32 26-12-4-16-20-8-32 10-14 30-22 46-20 16 2 26 14 26 28 0 10-6 18-14 18-10 0-16-10-14-22 4-18 20-32 36-32 10 0 18 6 22 12 16 0 46 1 66 2';
const SCRAWL_DASH = 1400;

export function ListeningArt() {
  // The scrawl's flat leading and trailing tails are meant to run off both edges of
  // the screen, not stop at the 300px stage. Stretching the viewBox horizontally
  // carries them out; `non-scaling-stroke` keeps the line weight even once it does.
  const { width } = useWindowDimensions();

  // obScrawl: 1400 → 0 → -1400, so the line writes itself then unwrites.
  const draw = useLoop(13000, 0, Easing.bezier(0.4, 0, 0.5, 1));
  // obJitter: the restless, not-quite-still hand.
  const jitter = useLoop(3400, 0);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(draw.value, [0, 0.52, 1], [SCRAWL_DASH, 0, -SCRAWL_DASH]),
    opacity: interpolate(draw.value, [0, 0.06, 0.52, 0.66, 1], [0, 0.9, 0.9, 0.75, 0]),
  }));

  const jitterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(jitter.value, [0, 0.25, 0.55, 0.8, 1], [0, 0.9, -0.8, 0.6, 0]) },
      { translateY: interpolate(jitter.value, [0, 0.25, 0.55, 0.8, 1], [0, -0.7, 0.8, 0.5, 0]) },
    ],
  }));

  return (
    <View style={styles.stage}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            // Wider than the stage, so centre it by pulling the overhang back.
            left: (ART_SIZE - width) / 2,
            top: 0,
            width,
            height: ART_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          },
          jitterStyle,
        ]}
      >
        <Svg
          width={width}
          height={150}
          viewBox="2 0 278 150"
          preserveAspectRatio="none"
          fill="none"
        >
          <AnimatedPath
            d={SCRAWL_D}
            stroke={LilyColors.accent}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeDasharray={SCRAWL_DASH}
            vectorEffect="non-scaling-stroke"
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>

      {DUST.map((d) => (
        <DustMote key={`${d.from.x}-${d.from.y}`} {...d} />
      ))}

      <DriftPhrase to={{ x: 88, y: 78 }} position={{ left: -6, top: 33 }}>
        I don’t know…
      </DriftPhrase>
      <DriftPhrase to={{ x: -96, y: -42 }} position={{ right: -6, top: 162 }} delay={3300}>
        It’s been a lot.
      </DriftPhrase>
      <DriftPhrase to={{ x: 58, y: -92 }} position={{ left: 18, bottom: 12 }} delay={6600}>
        Can I tell you something?
      </DriftPhrase>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * 00b — Memory
 * ------------------------------------------------------------------ */

/**
 * The brain from the design doc's 00b visual: a line-art cortex whose folds keep
 * firing, with memories lighting up along them. Drawn on the same 300×300 canvas.
 */
const BRAIN_OUTLINE = [
  // Cortex.
  'M78 168c-14-8-18-24-8-36-8-10 0-24 14-26 4-12 20-18 32-12 10-10 30-10 40 0 14-6 30-2 36 10 18 0 30 14 26 28 12 10 10 28-4 34 2 12-8 22-20 20-6 10-22 14-32 8-12 8-30 6-38-4-14 6-30 0-34-12-8 2-14-2-12-10Z',
  // Cerebellum.
  'M186 186c10 4 16 14 12 22-4 8-16 10-24 6-8-4-10-16-4-22 4-4 12-8 16-6Z',
  // Stem.
  'M176 206c2 10-2 18-8 24',
];

/** Each fold is a synapse: the dash pattern travels along it. */
const BRAIN_FOLDS = [
  'M92 132c14-8 26-4 34 6 8 10 4 22-6 26',
  'M120 112c12 6 14 20 6 28-8 8-6 20 4 24',
  'M150 106c-6 14 2 26 14 30 12 4 16 18 8 26',
  'M180 116c-10 8-10 22 0 30 10 8 8 22-2 28',
  'M204 134c-12 4-18 16-12 26',
];

/** Memories sitting on the folds. */
const NODES: { x: number; y: number; r: number }[] = [
  { x: 92, y: 132, r: 2.2 },
  { x: 126, y: 138, r: 2.6 },
  { x: 120, y: 112, r: 2 },
  { x: 130, y: 164, r: 2.4 },
  { x: 150, y: 106, r: 2.2 },
  { x: 164, y: 136, r: 3 },
  { x: 172, y: 162, r: 2.2 },
  { x: 180, y: 116, r: 2 },
  { x: 204, y: 134, r: 2.4 },
  { x: 192, y: 160, r: 2.2 },
];

function Fold({ d, delay }: { d: string; delay: number }) {
  // obSynapse: the dash pattern travels along the fold, so the link reads as firing.
  const p = useLoop(2600, delay, Easing.linear);

  const props = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(p.value, [0, 1], [0, -32]),
  }));

  return (
    <AnimatedPath
      d={d}
      stroke="#3FBF7F"
      strokeWidth={1.1}
      strokeOpacity={0.5}
      strokeLinecap="round"
      fill="none"
      strokeDasharray="5 11"
      animatedProps={props}
    />
  );
}

function TwinkleNode({ node, delay }: { node: (typeof NODES)[number]; delay: number }) {
  // obNode / obTwinkle: each memory brightens on its own rhythm.
  const p = useLoop(3200, delay);

  const props = useAnimatedProps(() => ({
    opacity: interpolate(p.value, [0, 0.45, 1], [0.3, 1, 0.3]),
    r: interpolate(p.value, [0, 0.45, 1], [node.r * 0.7, node.r * 1.15, node.r * 0.7]),
  }));

  return <AnimatedCircle cx={node.x} cy={node.y} r={node.r} fill="#9BEFC5" animatedProps={props} />;
}

export function MemoryArt() {
  // obBrainGlow: the whole web breathes.
  const glow = useLoop(6000);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 0.5, 1], [0.35, 0.7, 0.35]),
  }));

  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.fill, glowStyle]} pointerEvents="none">
        <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 300 300" fill="none">
          <G strokeLinecap="round" strokeLinejoin="round" fill="none">
            {BRAIN_OUTLINE.map((d) => (
              <Path key={d} d={d} stroke="#9BEFC5" strokeWidth={1.2} strokeOpacity={0.34} />
            ))}
          </G>
          <G>
            {BRAIN_FOLDS.map((d, i) => (
              <Fold key={d} d={d} delay={i * 240} />
            ))}
          </G>
          <G>
            {NODES.map((n, i) => (
              <TwinkleNode key={`${n.x}-${n.y}`} node={n} delay={i * 310} />
            ))}
          </G>
        </Svg>
      </Animated.View>

      <DriftPhrase
        to={{ x: 80, y: 74 }}
        position={{ left: -18, top: 15 }}
        fontSize={15.5}
        duration={12000}
      >
        That thing at work…
      </DriftPhrase>
      <DriftPhrase
        to={{ x: -88, y: -56 }}
        position={{ right: -18, top: 192 }}
        fontSize={15.5}
        duration={12000}
        delay={4000}
      >
        You mentioned Sunday…
      </DriftPhrase>
      <DriftPhrase
        to={{ x: 66, y: -88 }}
        position={{ left: -6, bottom: -6 }}
        fontSize={15.5}
        duration={12000}
        delay={8000}
      >
        You wanted to feel less overwhelmed.
      </DriftPhrase>
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * 00c — Your Space
 * ------------------------------------------------------------------ */

const SWELLS: { d: string; opacity: number }[] = [
  { d: 'M-20 118c40-16 80 16 120 0s80-32 120-16 80 16 120 0', opacity: 0.16 },
  { d: 'M-20 150c40-14 80 14 120 0s80-28 120-14 80 14 120 0', opacity: 0.34 },
  { d: 'M-20 182c40-12 80 12 120 0s80-26 120-12 80 12 120 0', opacity: 0.26 },
  { d: 'M-20 212c40-10 80 10 120 0s80-22 120-10 80 10 120 0', opacity: 0.14 },
];

/**
 * obSwell — one wave rising and falling.
 *
 * The transform rides a wrapping view rather than the SVG `<G>` it wraps: svg turns
 * `scaleY`/`translateY` into a matrix during the JS render pass, which animatedProps
 * bypasses, so driving them there animates nothing at all.
 */
function Swell({
  d,
  opacity,
  delay,
  width,
}: {
  d: string;
  opacity: number;
  delay: number;
  width: number;
}) {
  const p = useLoop(13000, delay);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0.35, 0.8, 0.35]),
    transform: [
      { translateY: interpolate(p.value, [0, 0.5, 1], [4, -4, 4]) },
      { scaleY: interpolate(p.value, [0, 0.5, 1], [0.9, 1.1, 0.9]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width, height: ART_SIZE }, style]}
    >
      {/* The paths are authored from x -20 to 340; matching the viewBox to that span
          and turning the aspect ratio off runs them the full width, and
          non-scaling-stroke keeps the hairline even once stretched. Only the
          horizontal axis stretches, so the wave heights stay as drawn. */}
      <Svg
        width={width}
        height={ART_SIZE}
        viewBox="-20 0 360 300"
        preserveAspectRatio="none"
        fill="none"
      >
        <Path
          d={d}
          stroke="#9BEFC5"
          strokeWidth={1}
          strokeLinecap="round"
          strokeOpacity={opacity}
          vectorEffect="non-scaling-stroke"
        />
      </Svg>
    </Animated.View>
  );
}

/** `obWord` — the word settles out of a blur; RN has no blur, so it settles out of tracking. */
function SettlingWord({
  children,
  delay,
  position,
}: {
  children: string;
  delay: number;
  position: object;
}) {
  const active = React.useContext(ArtActive);
  const p = useSharedValue(0);

  React.useEffect(() => {
    if (!active) {
      cancelAnimation(p);
      p.value = 0;
      return;
    }
    p.value = withDelay(delay, withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }));
    return () => cancelAnimation(p);
  }, [active, p, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 1], [0, 0.78]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    letterSpacing: interpolate(p.value, [0, 1], [4, 0.3]),
  }));

  return (
    <Animated.View style={[{ position: 'absolute' }, position, style]} pointerEvents="none">
      <Animated.Text
        style={[
          { fontFamily: LilyFonts.serif, fontSize: 19, color: '#E4F3EA', textAlign: 'center' },
          textStyle,
        ]}
      >
        {children}
      </Animated.Text>
    </Animated.View>
  );
}

export function SpaceArt() {
  const { width } = useWindowDimensions();

  // obTide slides the whole surface ±8% of the stage. The wave layer is drawn wider
  // than the screen by that much again, so the slide can never pull an edge into view.
  const tideTravel = 0.08 * ART_SIZE;
  const waveWidth = width + tideTravel * 2 + 32;

  const tide = useLoop(26000);

  const tideStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(tide.value, [0, 0.5, 1], [-tideTravel, tideTravel, -tideTravel]) },
    ],
  }));

  return (
    <View style={styles.stage}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: (ART_SIZE - waveWidth) / 2,
            top: 0,
            width: waveWidth,
            height: ART_SIZE,
          },
          tideStyle,
        ]}
      >
        {SWELLS.map((sw, i) => (
          <Swell key={sw.d} d={sw.d} opacity={sw.opacity} delay={i * 1600} width={waveWidth} />
        ))}
      </Animated.View>

      <SettlingWord delay={2400} position={{ top: 24, left: 0, right: 0 }}>
        Talk.
      </SettlingWord>
      <SettlingWord delay={4000} position={{ top: 145, right: 6 }}>
        Reflect.
      </SettlingWord>
      <SettlingWord delay={5600} position={{ bottom: 24, left: 0, right: 0 }}>
        Grow.
      </SettlingWord>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: ART_SIZE,
    height: ART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, width: ART_SIZE, height: ART_SIZE },
});
