import { LilyColors, LilyFonts } from '@/constants/lily';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TouchableOpacity, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../state/onboardingStore';

const AGE_OPTIONS = ['Under 18', '18–24', '25–34', '35–44', '45+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const SUPPORT_OPTIONS = ['Just listen', 'Offer suggestions', 'Help me set goals'];

const TOTAL_STEPS = 7;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 15, fontFamily: LilyFonts.sansSemi, color: LilyColors.textPrimary }}>
      {children}
    </Text>
  );
}

function Chip({
  label,
  selected,
  onPress,
  width,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  width?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: width as never,
        borderRadius: 14,
        paddingVertical: 13,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? LilyColors.accent : LilyColors.hairline,
        backgroundColor: selected
          ? 'rgba(63,191,127,0.12)'
          : LilyColors.surface,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontFamily: selected ? LilyFonts.sansMedium : LilyFonts.sans,
          color: selected ? LilyColors.accent : LilyColors.textBody,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PersonalDetails() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [support, setSupport] = useState('');

  const isFormValid = !!(name && age && gender && support);

  function handleSelect(setter: (v: string) => void, value: string) {
    Haptics.selectionAsync();
    setter(value);
  }

  function handleContinue() {
    if (!isFormValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setValue('name', name);
    setValue('age', age);
    setValue('gender', gender);
    setValue('support_style', support);
    router.push('/(onboarding_form)/difficulty');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      <View style={{ paddingTop: 20, paddingBottom: 6, alignItems: 'center' }}>
        <Text
          style={{ fontSize: 12.5, fontFamily: LilyFonts.sans, color: LilyColors.textMuted }}
        >
          Personal Details
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 12 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === 0 ? 10 : 8,
              height: i === 0 ? 10 : 8,
              borderRadius: 9999,
              backgroundColor: i === 0 ? LilyColors.accent : 'rgba(255,255,255,0.14)',
            }}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <Text
          style={{
            fontFamily: LilyFonts.serif,
            fontSize: 30,
            lineHeight: 36,
            textAlign: 'center',
            color: LilyColors.textPrimary,
            paddingHorizontal: 24,
            paddingTop: 22,
            paddingBottom: 22,
          }}
        >
          Let’s get to know you a little.
        </Text>

        <View style={{ paddingHorizontal: 22, gap: 28 }}>
          {/* Name */}
          <View style={{ gap: 10 }}>
            <FieldLabel>Name</FieldLabel>
            <View
              style={{
                height: 54,
                borderRadius: 16,
                paddingHorizontal: 16,
                justifyContent: 'center',
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: LilyColors.hairline,
              }}
            >
              <TextInput
                placeholder="What should I call you?"
                placeholderTextColor={LilyColors.textFaint}
                value={name}
                onChangeText={setName}
                style={{
                  fontFamily: LilyFonts.sans,
                  fontSize: 15,
                  color: LilyColors.textPrimary,
                  padding: 0,
                }}
              />
            </View>
          </View>

          {/* Age */}
          <View style={{ gap: 12 }}>
            <FieldLabel>Age</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {AGE_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  width="31.5%"
                  selected={age === opt}
                  onPress={() => handleSelect(setAge, opt)}
                />
              ))}
            </View>
          </View>

          {/* Gender */}
          <View style={{ gap: 12 }}>
            <FieldLabel>Gender</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GENDER_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  width="48%"
                  selected={gender === opt}
                  onPress={() => handleSelect(setGender, opt)}
                />
              ))}
            </View>
          </View>

          {/* Support style */}
          <View style={{ gap: 12 }}>
            <FieldLabel>How can we best support you?</FieldLabel>
            <View style={{ gap: 8 }}>
              {SUPPORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(setSupport, opt)}
                  style={{
                    height: 54,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: support === opt ? LilyColors.accent : LilyColors.hairline,
                    backgroundColor:
                      support === opt
                        ? 'rgba(63,191,127,0.12)'
                        : LilyColors.surface,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: support === opt ? LilyFonts.sansMedium : LilyFonts.sans,
                      color: support === opt ? LilyColors.accent : LilyColors.textBody,
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: LilyColors.ground,
          borderTopWidth: 1,
          borderTopColor: LilyColors.hairline,
          paddingTop: 18,
          paddingBottom: 30,
          paddingHorizontal: 22,
          alignItems: 'center',
          gap: 14,
        }}
      >
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 100,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !isFormValid
              ? 'rgba(63,191,127,0.3)'
              : LilyColors.accent,
          }}
        >
          <Text style={{ fontSize: 16, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}>
            Continue
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12 }}>🔒</Text>
          <Text
            style={{
              fontFamily: LilyFonts.sans,
              color: LilyColors.textFaint,
              fontSize: 12,
              flexShrink: 1,
            }}
          >
            Your data is private and secure
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
