import LilyChatScreen from '@/components/lily/LilyChatScreen';
import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { LilyColors } from '@/constants/lily';
import { StatusBar } from 'expo-status-bar';

export default function ChatRoute() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LilyColors.ground,
        }}
      >
        <ActivityIndicator color={LilyColors.accent} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <LilyChatScreen />
    </>
  );
}
