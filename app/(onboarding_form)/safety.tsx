import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { classifyFailure, trackOnboardingCompleted, trackOnboardingFailed } from '@/services/analytics';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSubmitOnboarding } from '../../hooks/useSubmitOnboarding';
import { useOnboardingStore } from '../../state/onboardingStore';

const SAFETY_OPTIONS = ['No', 'A few times before', 'Yes, recently'];

export default function SafetyCheck() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);

  const [selectedSafety, setSelectedSafety] = useState('No');
  const [isCompleting, setIsCompleting] = useState(false);

  const { submitOnboarding, loading } = useSubmitOnboarding();

  function handleSelect(option: string) {
    setSelectedSafety(option);
    setValue('Safety_Check', option);
  }

  async function handleFinish() {
    if (isCompleting) return;

    setValue('Safety_Check', selectedSafety);
    setIsCompleting(true);

    const result = await submitOnboarding();

    if (!result.success) {
      // The category only — the error text stays on the device.
      trackOnboardingFailed(classifyFailure(result.error));
      console.error('Insert failed:', result.error);
      Alert.alert('Oops!', "We couldn't save your information. Please try again.", [
        { text: 'OK' },
      ]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsCompleting(false);
      return;
    }

    trackOnboardingCompleted();

    // Onboarding state lives in user_info and the local cache that
    // submitOnboarding has already written. This used to also set
    // Clerk unsafeMetadata.onboardingComplete, which nothing anywhere read —
    // and when that write failed it told people "we couldn't complete setup,
    // please restart the app" even though their answers were safely saved and
    // the app would have let them straight in.
    router.replace('/loading');
  }

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      <LilyChoiceStep
        step={7}
        question="Have you ever felt like harming yourself or giving up?"
        options={SAFETY_OPTIONS}
        selected={selectedSafety}
        onSelect={handleSelect}
        onNext={handleFinish}
        nextLabel="Finish"
        busy={loading || isCompleting}
      />

      {selectedSafety === 'Yes, recently' && (
        <View
          style={{
            position: 'absolute',
            left: 22,
            right: 22,
            bottom: 118,
            backgroundColor: LilyColors.surfaceCard,
            borderWidth: 1,
            borderColor: 'rgba(63,191,127,0.18)',
            borderRadius: 22,
            paddingVertical: 15,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ fontFamily: LilyFonts.serif, fontSize: 16, color: '#D3EADF' }}>
            I&apos;m here for you
          </Text>
          <Text
            style={{
              fontSize: 12.5,
              lineHeight: 20,
              fontFamily: LilyFonts.sans,
              color: '#9FBCAE',
              marginTop: 4,
            }}
          >
            Lily isn&apos;t a crisis service. I&apos;ll point you to people who can help right
            away.
          </Text>
        </View>
      )}
    </View>
  );
}
