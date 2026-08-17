import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../state/onboardingStore';

const DURATION_OPTIONS = ['A few days', 'A few weeks', 'A few months', 'More than a year'];

export default function Duration() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selected, setSelected] = useState('A few weeks');

  return (
    <LilyChoiceStep
      step={3}
      question="How long has this been affecting you?"
      options={DURATION_OPTIONS}
      selected={selected}
      onSelect={setSelected}
      onNext={() => {
        setValue('Duration', selected);
        router.push('/(onboarding_form)/impact');
      }}
    />
  );
}
