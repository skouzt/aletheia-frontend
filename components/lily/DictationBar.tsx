import { LEVEL_COUNT, type Dictation } from '@/hooks/useDictation';
import { LilyColors, LilyFonts, LilyGradients } from '@/constants/lily';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const BAR_WIDTH = 3;
const BAR_GAP = 3;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 30;

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M1 1l12 12M13 1L1 13"
        stroke={LilyColors.textNeutral}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={13} viewBox="0 0 16 13" fill="none">
      <Path
        d="M1.5 6.8l4.4 4.4L14.5 1.6"
        stroke="#0A1A12"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * One bar of the waveform. Each reads its own slot out of the shared level buffer,
 * so the whole strip animates on the UI thread without a single React re-render —
 * at fourteen metering ticks a second, going through state would re-render the
 * entire chat screen instead.
 */
function WaveBar({ levels, index }: { levels: Dictation['levels']; index: number }) {
  const style = useAnimatedStyle(() => {
    const level = levels.value[index] ?? 0;
    return {
      // withTiming inside the style smooths between metering ticks; without it the
      // strip visibly steps at 70ms intervals.
      height: withTiming(MIN_HEIGHT + level * (MAX_HEIGHT - MIN_HEIGHT), {
        duration: 110,
        easing: Easing.out(Easing.quad),
      }),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          marginHorizontal: BAR_GAP / 2,
          borderRadius: BAR_WIDTH,
          backgroundColor: LilyColors.textNeutral,
        },
        style,
      ]}
    />
  );
}

const BARS = Array.from({ length: LEVEL_COUNT }, (_, i) => i);

/**
 * The take-in-progress composer: discard on the left, a live waveform of what the
 * mic is hearing, keep on the right. Replaces the input pill while dictating so
 * there is never a question about whether the app is listening.
 */
export function DictationBar({ dictation }: { dictation: Dictation }) {
  const transcribing = dictation.state === 'transcribing';

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)}>
      <Text
        style={{
          fontFamily: LilyFonts.serif,
          fontStyle: 'italic',
          fontSize: 15,
          color: LilyColors.textMuted,
          paddingHorizontal: 14,
          paddingBottom: 14,
        }}
      >
        {transcribing ? 'Working out what you said…' : 'Listening…'}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderRadius: 30,
          backgroundColor: LilyColors.surfaceComposer,
          borderWidth: 1,
          borderColor: LilyColors.hairlineDim,
        }}
      >
        <TouchableOpacity
          onPress={dictation.cancel}
          disabled={transcribing}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: LilyColors.surface,
            opacity: transcribing ? 0.4 : 1,
          }}
        >
          <CloseIcon />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            height: MAX_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: transcribing ? 0.35 : 1,
          }}
        >
          {BARS.map((i) => (
            <WaveBar key={i} levels={dictation.levels} index={i} />
          ))}
        </View>

        <TouchableOpacity
          onPress={dictation.finish}
          disabled={transcribing}
          hitSlop={8}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={LilyGradients.send}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {transcribing ? <ActivityIndicator size="small" color="#0A1A12" /> : <CheckIcon />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
