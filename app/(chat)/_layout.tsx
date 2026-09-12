import { LilyColors } from '@/constants/lily';
import { Stack } from 'expo-router';

// No guard here: the root navigator wraps this group in Stack.Protected, so an
// unfinished onboarding means these routes do not exist to navigate to.
export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: LilyColors.ground },
      }}
    />
  );
}
