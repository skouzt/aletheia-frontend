import { CallProvider } from "@/context/CallContext";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { registerGlobals } from '@livekit/react-native';
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { SplashScreen, Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

WebBrowser.maybeCompleteAuthSession();
registerGlobals();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, error] = useFonts({
    "LibreCaslonText-Bold": require("../assets/fonts/LibreCaslonText-Bold.ttf"),
    "LibreCaslonText-Italic": require("../assets/fonts/LibreCaslonText-Italic.ttf"),
    "LibreCaslonText-Regular": require("../assets/fonts/LibreCaslonText-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(() => {
    const handleCheckoutReturn = (url?: string | null) => {
      if (!url) return;

      if (url.includes("payment/result")) {
        router.replace("/payment/result");
      }
    };

    Linking.getInitialURL().then(handleCheckoutReturn);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleCheckoutReturn(url);
    });

    return () => subscription.remove();
  }, [router]);

  if (!fontsLoaded) return null;

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
  if (!publishableKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
    
  }


  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <CallProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding_form)" />
              <Stack.Screen name="payment/result" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="(modal)"
                options={{
                  presentation: "transparentModal",
                  animation: "slide_from_bottom",
                }}
              />
            </Stack>
          </CallProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
