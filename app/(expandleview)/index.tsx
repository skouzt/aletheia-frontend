import { CloseX } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const INTENSITY_LABELS = [
  'Too much',
  'Anxious',
  'Overwhelmed',
  'Strained',
  'Heavy',
  'Uneasy',
  'Neutral',
  'Light',
  'Okay',
  'At ease',
];

/** Same mint-family mapping as the summaries list — a hard day is never an alarm. */
function getEmotionInfo(intensity: any) {
  const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 7)));
  const label = INTENSITY_LABELS[value - 1] || INTENSITY_LABELS[6];

  if (value >= 8)
    return { label, color: LilyColors.accentBright, tint: 'rgba(110,242,176,0.12)', value };
  if (value >= 4)
    return { label, color: LilyColors.textSoft, tint: 'rgba(255,255,255,0.07)', value };
  return { label, color: LilyColors.accent, tint: 'rgba(63,191,127,0.14)', value };
}

export default function ExpandViewScreen() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const { date, summary, intensity } = useLocalSearchParams<{
    date?: string;
    summary?: string;
    intensity?: string;
  }>();

  const intensityValue = Math.min(Math.max(Number(intensity || 0), 0), 10);
  const emotion = getEmotionInfo(intensity);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 550);
  };

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(600).delay(50)}
          exiting={SlideOutDown.duration(500).easing(Easing.in(Easing.ease))}
          style={{
            // Full height: at 92% the strip of black above read as a rendering gap
            // rather than a deliberate sheet, since the page behind is black too.
            flex: 1,
            backgroundColor: LilyColors.ground,

            overflow: 'hidden',
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View
              style={{
                paddingHorizontal: 22,
                paddingTop: 22,
                paddingBottom: 18,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: LilyFonts.serif,
                    fontSize: 30,
                    lineHeight: 34,
                    color: LilyColors.textPrimary,
                  }}
                >
                  Session{'\n'}Summary
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: LilyFonts.sans,
                    color: LilyColors.accent,
                    marginTop: 8,
                  }}
                >
                  {date ? format(new Date(date), 'MMMM d, yyyy • h:mm a') : ''}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                hitSlop={10}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.ghostFill,
                }}
              >
                <CloseX />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
            >
              {/* Emotional state */}
              <View
                style={{
                  backgroundColor: LilyColors.surface,
                  borderWidth: 1,
                  borderColor: LilyColors.hairline,
                  borderRadius: 24,
                  padding: 18,
                  marginBottom: 24,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.textPrimary,
                    }}
                  >
                    Emotional State
                  </Text>

                  <View
                    style={{
                      backgroundColor: emotion.tint,
                      borderRadius: 100,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: LilyFonts.sansMedium,
                        color: emotion.color,
                        letterSpacing: 0.4,
                      }}
                    >
                      {emotion.label}
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}
                  >
                    Intensity
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.accent,
                    }}
                  >
                    {intensityValue}/10
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        height: 6,
                        flex: 1,
                        borderRadius: 3,
                        backgroundColor:
                          i < intensityValue ? LilyColors.accent : 'rgba(255,255,255,0.10)',
                      }}
                    />
                  ))}
                </View>
              </View>

              {/* What we discussed */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: LilyColors.accent,
                      marginRight: 9,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.textPrimary,
                    }}
                  >
                    What We Discussed
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: LilyColors.surface,
                    borderWidth: 1,
                    borderColor: LilyColors.hairline,
                    borderRadius: 24,
                    padding: 18,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      lineHeight: 24,
                      fontFamily: LilyFonts.sans,
                      color: LilyColors.textBody,
                    }}
                  >
                    {summary
                      ? decodeURIComponent(summary)
                      : 'Detailed summary will be available soon.'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}
