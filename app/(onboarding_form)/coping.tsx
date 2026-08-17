import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../state/onboardingStore';

const COPING_OPTIONS = [
  'I talk to someone',
  'I distract myself (music, games, etc.)',
  'I keep it inside',
  "I don't know how to handle it",
];

export default function CopingStyle() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selected, setSelected] = useState('I distract myself (music, games, etc.)');

  return (
    <LilyChoiceStep
      step={5}
      question="When it gets tough, what do you usually do?"
      options={COPING_OPTIONS}
      selected={selected}
      onSelect={setSelected}
      onNext={() => {
        setValue('Coping_Style', selected);
        router.push('/(onboarding_form)/support');
      }}
    />
  );
}
