import { LilyColors } from '@/constants/lily';
import { Stack } from 'expo-router';

/**
 * One screen. Plan selection lives on the paywall (TrialOfferScreen), so the old
 * plans / changeplan / manage trio collapsed into this.
 */
export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        animation: 'slide_from_bottom',
        gestureEnabled: true,
        contentStyle: { backgroundColor: LilyColors.ground },
      }}
    />
  );
}
