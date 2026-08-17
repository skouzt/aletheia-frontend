import { LilyChrome } from '@/components/lily/LilyChrome';
import SettingsScreen from '@/components/Settings';
import { StatusBar } from 'expo-status-bar';

export default function Route() {
  return (
    <LilyChrome activeTab="space">
      <StatusBar style="light" />
      <SettingsScreen />
    </LilyChrome>
  );
}
