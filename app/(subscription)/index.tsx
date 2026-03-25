import { useSubscription } from "@/hooks/useSubscription";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";

export default function SubscriptionEntry() {
  const router = useRouter();
  const { status, loading } = useSubscription();

  useEffect(() => {
    if (loading) return;

    if (status === "active") {
      router.replace("/(subscription)/manage");
    } else {
      router.replace("/(subscription)/plans");
    }
  }, [status, loading, router]);


  return (
     <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <LinearGradient
        colors={["#FFE6A0", "#F7EED7", "#F6F8F7"]}
        locations={[0, 0.58, 1]}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Image
            source={require("@/assets/images/subscribe1.gif")}
            style={{ width: 180, height: 180, marginBottom: 20 }}
            resizeMode="contain"
          />

          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              marginTop: 4,
            }}
          >
            One moment…
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
