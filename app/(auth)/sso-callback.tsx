import { LilyColors, LilyFonts } from '@/constants/lily';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function SSOCallback() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace('/');
    } else {
      router.replace('/(auth)/auth');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LilyColors.ground,
      }}
    >
      <ActivityIndicator size="large" color={LilyColors.accent} />
      <Text
        style={{
          marginTop: 16,
          fontFamily: LilyFonts.sans,
          fontSize: 14,
          color: LilyColors.textMuted,
        }}
      >
        Completing sign in…
      </Text>
    </View>
  );
}
