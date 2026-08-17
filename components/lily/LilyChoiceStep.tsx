import { LilyColors, LilyFonts } from '@/constants/lily';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, TouchableOpacity, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Shared onboarding step: progress dots, a serif question, a list of choices,
 * and a mint continue button. Used by every single- and multi-select step so the
 * screens stay identical apart from their copy.
 */
export function LilyChoiceStep({
  step,
  totalSteps = 7,
  question,
  options,
  selected,
  onSelect,
  multi = false,
  onNext,
  nextLabel = 'Next',
  busy = false,
  footnote,
}: {
  step: number;
  totalSteps?: number;
  question: string;
  options: string[];
  /** A string for single-select, an array for multi-select. */
  selected: string | string[];
  onSelect: (option: string) => void;
  multi?: boolean;
  onNext: () => void;
  nextLabel?: string;
  busy?: boolean;
  footnote?: string;
}) {
  const isSelected = (option: string) =>
    multi ? (selected as string[]).includes(option) : selected === option;

  const canContinue = multi ? (selected as string[]).length > 0 : !!selected;

  const handleSelect = (option: string) => {
    Haptics.selectionAsync();
    onSelect(option);
  };

  const handleNext = () => {
    if (!canContinue || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      {/* Progress */}
      <View style={{ paddingTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const active = i === step - 1;
          const done = i < step - 1;
          return (
            <View
              key={i}
              style={{
                width: active ? 10 : 8,
                height: active ? 10 : 8,
                borderRadius: 9999,
                backgroundColor: active
                  ? LilyColors.accent
                  : done
                    ? 'rgba(63,191,127,0.35)'
                    : 'rgba(255,255,255,0.14)',
              }}
            />
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 22,
          paddingTop: 28,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: 28,
            lineHeight: 34,
            textAlign: 'center',
            color: LilyColors.textPrimary,
            marginBottom: 26,
          }}
        >
          {question}
        </Text>

        <View style={{ gap: 10 }}>
          {options.map((option) => {
            const on = isSelected(option);
            return (
              <TouchableOpacity
                key={option}
                onPress={() => handleSelect(option)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: on ? LilyColors.accent : LilyColors.hairline,
                  backgroundColor: on
                    ? 'rgba(63,191,127,0.10)'
                    : LilyColors.surface,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    lineHeight: 22,
                    fontFamily: LilyFonts.sans,
                    color: on ? LilyColors.textPrimary : LilyColors.textBody,
                  }}
                >
                  {option}
                </Text>

                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: multi ? 6 : 10,
                    borderWidth: 2,
                    borderColor: on ? LilyColors.accent : 'rgba(255,255,255,0.22)',
                    backgroundColor: on ? LilyColors.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {on && (
                    <View
                      style={{
                        width: multi ? 8 : 9,
                        height: multi ? 8 : 9,
                        borderRadius: multi ? 2 : 4.5,
                        backgroundColor: LilyColors.ground,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          paddingHorizontal: 22,
          paddingTop: 18,
          paddingBottom: 30,
          backgroundColor: LilyColors.ground,
          borderTopWidth: 1,
          borderTopColor: LilyColors.hairline,
        }}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canContinue || busy}
          style={{
            height: 54,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              !canContinue || busy
                ? 'rgba(63,191,127,0.3)'
                : LilyColors.accent,
          }}
        >
          {busy ? (
            <ActivityIndicator color={LilyColors.ground} />
          ) : (
            <Text
              style={{ fontSize: 16, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}
            >
              {nextLabel}
            </Text>
          )}
        </TouchableOpacity>

        {!!footnote && (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 11.5,
              fontFamily: LilyFonts.sans,
              color: LilyColors.textFaint,
              marginTop: 12,
            }}
          >
            {footnote}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
