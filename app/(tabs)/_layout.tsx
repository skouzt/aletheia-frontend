import { LilyColors } from '@/constants/lily';
import { Tabs } from 'expo-router';

/**
 * Grouped under (tabs) for URL stability only — there is no tab bar. Navigation is
 * the hamburger sheet (see LilyChrome), and chat is the landing surface.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
        headerShown: false,
        sceneStyle: { backgroundColor: LilyColors.ground },
      }}
    >
      <Tabs.Screen name="summary" />
      <Tabs.Screen name="setting" />
    </Tabs>
  );
}
