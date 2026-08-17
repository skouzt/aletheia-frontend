import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSubmitOnboarding } from '../../hooks/useSubmitOnboarding';
import { useOnboardingStore } from '../../state/onboardingStore';

const SAFETY_OPTIONS = ['No', 'A few times before', 'Yes, recently'];

export default function SafetyCheck() {
  const router = useRouter();
  const { user } = useUser();
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
      console.error('Insert failed:', result.error);
      Alert.alert('Oops!', "We couldn't save your information. Please try again.", [
        { text: 'OK' },
      ]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsCompleting(false);
      return;
    }

    try {
      await user?.update({ unsafeMetadata: { onboardingComplete: true } });
      await user?.reload();
      router.replace('/loading');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        'Almost there!',
        "Your data was saved but we couldn't complete setup. Please restart the app.",
        [{ text: 'OK' }],
      );
      setIsCompleting(false);
    }
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
