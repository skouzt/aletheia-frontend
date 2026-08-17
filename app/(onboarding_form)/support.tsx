import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../state/onboardingStore';

const SUPPORT_OPTIONS = ['Yes, usually', 'Sometimes', 'Not really', 'No, I feel alone in it'];

export default function SupportNetwork() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selected, setSelected] = useState('Sometimes');

  return (
    <LilyChoiceStep
      step={6}
      question="Do you have someone you can talk to when you feel low?"
      options={SUPPORT_OPTIONS}
      selected={selected}
      onSelect={setSelected}
      onNext={() => {
        setValue('Support_Network', selected);
        router.push('/(onboarding_form)/safety');
      }}
    />
  );
}
