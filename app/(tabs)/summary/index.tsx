import { LilyChrome } from '@/components/lily/LilyChrome';
import SessionSummariesScreen from '@/components/summary';
import { StatusBar } from 'expo-status-bar';

export default function Route() {
  return (
    <LilyChrome activeTab="days">
      <StatusBar style="light" />
      <SessionSummariesScreen />
    </LilyChrome>
  );
}
