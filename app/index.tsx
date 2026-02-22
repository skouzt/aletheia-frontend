import { useCheckOnboarding } from "@/hooks/useCheckOnboarding";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding, isLoading } = useCheckOnboarding();

  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayDone(true);
    }, 4000); 

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded || isLoading || !delayDone) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
        }}
      >
         <LinearGradient
          colors={["#FFD36A", "#FFB347", "#F5F8F7"]}
          locations={[0, 0.55, 1]}
          className="flex-1"
        >
        
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/images/loading.gif")}
            style={{
              width: 180,
              height: 180,
              marginBottom: 20,
            }}
            resizeMode="contain"
          />

          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 4,
            }}
          >
            Getting things ready for you…
          </Text>
        </View>
        </LinearGradient>
      </View>
      
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/auth" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(onboarding_form)/personal" />;
}