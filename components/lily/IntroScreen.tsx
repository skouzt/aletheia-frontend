import { ArtActive } from '@/components/lily/IntroArt';
import { ArrowRight } from '@/components/lily/ui';
import { LilyGlow } from '@/components/lily/LilyWelcomeArt';
import { LilyColors, LilyFonts, LilyGradients } from '@/constants/lily';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Wash = { width: number; height: number; opacity: number; top: string };

/**
 * The shell every intro screen shares: a single radial wash behind a full-bleed
 * visual, the copy block, the step rail, and one forward action.
 *
 * The design doc drives all three screens from the same `ob*` markup, so the
 * differences here are only the wash size and the CTA treatment.
 */
export function IntroScreen({
  art,
  wash,
  headline,
  body,
  footnote,
  step,
  onNext,
  cta,
  variant = 'link',
  artPaddingTop = 0,
  active,
}: {
  art: React.ReactNode;
  wash: Wash;
  headline: string;
  body: string;
  footnote?: string;
  /** 0-based index of the lit segment in the three-step rail. */
  step: number;
  onNext: () => void;
  cta: string;
  variant?: 'link' | 'primary';
  artPaddingTop?: number;
  /** Whether this is the page in view; off-screen pages hold their animations. */
  active: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: wash.top as any,
          left: '50%',
          marginLeft: -wash.width / 2,
          marginTop: -wash.height / 2,
        }}
      >
        <LilyGlow
          width={wash.width}
          height={wash.height}
          color="#1F8C58"
          opacity={wash.opacity}
          stopAt={0.66}
        />
      </View>

      <View style={{ height: Math.max(insets.top, 20) + 32 }} />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          paddingTop: artPaddingTop,
        }}
      >
        <ArtActive.Provider value={active}>{art}</ArtActive.Provider>
      </View>

      <View
        style={{
          paddingHorizontal: 30,
          paddingBottom: Math.max(insets.bottom, 16) + 18,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: variant === 'primary' ? 31 : 32,
            lineHeight: variant === 'primary' ? 37 : 38,
            textAlign: 'center',
            color: LilyColors.textPrimary,
          }}
        >
          {headline}
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 21,
            textAlign: 'center',
            fontFamily: LilyFonts.sans,
            color: LilyColors.textMuted,
            marginTop: 12,
          }}
        >
          {body}
        </Text>

        {variant === 'link' ? (
          <>
            {footnote ? <Footnote style={{ marginTop: 22 }}>{footnote}</Footnote> : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 26,
                marginTop: 26,
              }}
            >
              <StepRail step={step} />
              <TouchableOpacity
                onPress={onNext}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 6 }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: LilyFonts.sansSemi,
                    color: LilyColors.textPrimary,
                  }}
                >
                  {cta}
                </Text>
                <ArrowRight color={LilyColors.textPrimary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={{ marginTop: 24 }}>
              <StepRail step={step} />
            </View>
            <TouchableOpacity
              onPress={onNext}
              activeOpacity={0.9}
              style={{
                marginTop: 22,
                alignSelf: 'stretch',
                borderRadius: 100,
                overflow: 'hidden',
                shadowColor: '#0B4429',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.55,
                shadowRadius: 28,
              }}
            >
              <LinearGradient
                colors={LilyGradients.signUp}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingVertical: 17,
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: LilyFonts.sansSemi,
                    letterSpacing: 0.3,
                    color: '#DCF3E6',
                  }}
                >
                  {cta}
                </Text>
                <ArrowRight color="#DCF3E6" />
              </LinearGradient>
            </TouchableOpacity>
            {footnote ? <Footnote style={{ marginTop: 14 }}>{footnote}</Footnote> : null}
          </>
        )}
      </View>
    </View>
  );
}

function Footnote({ children, style }: { children: string; style?: object }) {
  return (
    <Text
      style={[
        {
          fontSize: 10.5,
          fontFamily: LilyFonts.sans,
          color: '#5E7268',
          textAlign: 'center',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Three segments; the current one stretches. */
function StepRail({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: i === step ? 16 : 5,
            height: 2,
            borderRadius: 2,
            backgroundColor: i === step ? LilyColors.accent : '#2A3A32',
          }}
        />
      ))}
    </View>
  );
}
