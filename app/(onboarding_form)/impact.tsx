import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../state/onboardingStore';

const IMPACT_OPTIONS = [
  'Hard to focus / be productive',
  'Mood changes a lot',
  'Trouble sleeping',
  'Avoiding people or conversations',
  'Feels heavy but still managing',
  'Not sure',
];

export default function DailyImpact() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (option: string) =>
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );

  return (
    <LilyChoiceStep
      step={4}
      question="How is this affecting your daily life?"
      options={IMPACT_OPTIONS}
      selected={selected}
      onSelect={toggle}
      multi
      footnote="Choose as many as fit."
      onNext={() => {
        setValue('Daily_Impact', selected.join(', '));
        router.push('/(onboarding_form)/coping');
      }}
    />
  );
}
