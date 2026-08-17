import { LilyColors } from '@/constants/lily';
import { Stack } from 'expo-router';

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
