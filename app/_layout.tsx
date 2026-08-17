import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import { SplashScreen, Stack, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

// NativeWind's react-native-css-interop touches `SafeAreaView` off the react-native
// root at import time to register its className handler, which trips RN's deprecation
// getter. Nothing in this app imports the deprecated component — every screen uses
// react-native-safe-area-context — so the warning is third-party noise.
LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, error] = useFonts({
    "LibreCaslonText-Bold": require("../assets/fonts/LibreCaslonText-Bold.ttf"),
    "LibreCaslonText-Italic": require("../assets/fonts/LibreCaslonText-Italic.ttf"),
    "LibreCaslonText-Regular": require("../assets/fonts/LibreCaslonText-Regular.ttf"),
    // Lily design system: Instrument Serif is her voice, Plus Jakarta Sans the interface.
    InstrumentSerif_400Regular,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding_form)" />
            <Stack.Screen name="payment/result" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(chat)" />
            <Stack.Screen
                name="(modal)"
              options={{
                presentation: "transparentModal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
