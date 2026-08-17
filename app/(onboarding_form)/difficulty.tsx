import { LilyChoiceStep } from '@/components/lily/LilyChoiceStep';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useOnboardingStore } from '../../state/onboardingStore';

const DIFFICULTY_OPTIONS = [
  'Stress from work / studies',
  'Relationship problems',
  'Loneliness / lack of support',
  'Anxiety / overthinking',
  'Low confidence / self-image',
  'Feeling sad or empty often',
  'Something else',
];

export default function CurrentDifficulty() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selected, setSelected] = useState<string[]>(['Stress from work / studies']);

  const toggle = (option: string) =>
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );

  return (
    <LilyChoiceStep
      step={2}
      question="What's been most difficult for you recently?"
      options={DIFFICULTY_OPTIONS}
      selected={selected}
      onSelect={toggle}
      multi
      footnote="Select all that apply"
      onNext={() => {
        setValue('Current_Difficulty', selected.join(', '));
        router.push('/(onboarding_form)/duration');
      }}
    />
  );
}
