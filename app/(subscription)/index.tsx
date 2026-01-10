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
        colors={["#E6F7F1", "#F2FBF7", "#FFFFFF"]}
        locations={[0, 0.6, 1]}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/images/subscribe.gif")}
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
