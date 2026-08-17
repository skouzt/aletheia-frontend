import { CloseX } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

const FAQS = [
  {
    q: 'How does Lily work?',
    a: 'Lily uses advanced language models trained on therapeutic techniques to offer supportive, non-judgmental conversation tailored to your emotional needs.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Absolutely. We use strong encryption and do not share your personal data with third parties without consent.',
  },
  {
    q: 'Are my conversations stored?',
    a: 'Your conversations are stored so Lily can remember your history. Anonymized data may be used to improve the AI, and you can opt out in Settings.',
  },
  {
    q: 'Can I talk to a human therapist?',
    a: 'Currently, this app is an AI-driven self-help tool. We do not offer direct access to human therapists at this time.',
  },
  {
    q: 'How does the subscription work?',
    a: 'Subscriptions are managed through your device’s app store. You can upgrade or cancel anytime from your subscription settings.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 280);
  };

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  function emailSupport() {
    Linking.openURL('mailto:skouzt3@gmail.com');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: LilyColors.scrim }}>
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.ease))}
          style={{
            height: '92%',
            overflow: 'hidden',
            backgroundColor: LilyColors.ground,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: LilyColors.hairlineBright,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                height: 4,
                width: 38,
                borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.16)',
              }}
            />
          </View>

          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 8,
              paddingBottom: 20,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: LilyFonts.serif,
                fontSize: 30,
                color: LilyColors.textPrimary,
              }}
            >
              Help &amp; Support
            </Text>
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
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 48 }}
          >
            <View style={{ gap: 10, marginBottom: 26 }}>
              {FAQS.map((item, i) => (
                <Animated.View
                  key={item.q}
                  layout={LinearTransition.duration(220).easing(Easing.inOut(Easing.ease))}
                  style={{
                    backgroundColor: LilyColors.surface,
                    borderWidth: 1,
                    borderColor: LilyColors.hairline,
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggle(i)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontFamily: LilyFonts.sansMedium,
                        color: LilyColors.textPrimary,
                      }}
                    >
                      {item.q}
                    </Text>
                    <Text style={{ color: LilyColors.accent, fontSize: 13 }}>
                      {openIndex === i ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {openIndex === i && (
                    <Animated.View
                      entering={FadeIn.duration(160)}
                      exiting={FadeOut.duration(120)}
                      style={{ paddingHorizontal: 16, paddingBottom: 16 }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          lineHeight: 23,
                          fontFamily: LilyFonts.sans,
                          color: LilyColors.textBody,
                        }}
                      >
                        {item.a}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: 'rgba(63,191,127,0.18)',
                borderRadius: 24,
                padding: 22,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ fontFamily: LilyFonts.serif, fontSize: 20, color: LilyColors.textPrimary }}
              >
                Still need help?
              </Text>
              <Text
                style={{
                  fontSize: 13.5,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textMuted,
                  marginTop: 4,
                  marginBottom: 20,
                  textAlign: 'center',
                }}
              >
                Our team is ready to assist you.
              </Text>

              <TouchableOpacity
                onPress={emailSupport}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.accent,
                }}
              >
                <Text
                  style={{ fontSize: 15, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}
                >
                  Email Support
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 11.5,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textFaint,
                  marginTop: 14,
                }}
              >
                We usually respond within 24–48 hours.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
