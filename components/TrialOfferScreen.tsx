import { API_URL } from "@/config/api";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

export default function TrialOfferScreen() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [isLoading, setisLoading] = useState(false);

  const handleStartTrial = async () => {
     if (isLoading) return; // Prevent double tap
    if (!isSignedIn) {
      Alert.alert("Sign In Required", "Please sign in to start your free trial.");
      return;
    }

    setisLoading(true);

    try {
      const token = await getToken({ template: "backend-api" });
      if (!token) throw new Error("Authentication failed");

      // Create checkout for Basic plan ($14)
      const res = await fetch(`${API_URL}/api/v1/billing/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_key: "clarity", // $14 plan
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail || "Checkout failed");
      }

      const { url } = await res.json();

      // Open Gumroad checkout in system browser
      await Linking.openURL(url);

      // Optionally close this modal
      router.back();
    } catch (err: any) {
      console.error("Checkout error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setisLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-black/50 items-center justify-center px-4">
      {/* CARD */}
      <View
        className="w-full max-w-md rounded-[28px] overflow-hidden"
        style={{ backgroundColor: "#F7F3EC" }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#EDE6D6", "#F0EAD8", "#F7F3EC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="pt-12 pb-6 items-center relative"
        >
          <Pressable
            onPress={handleClose}
            className="absolute top-4 right-4 items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Ionicons name="close" size={16} color="#7A7060" />
          </Pressable>

          <Image
            source={require("@/assets/images/trial.png")}
            resizeMode="contain"
            style={{ width: 200, height: 120, opacity: 0.85 }}
          />

          <View
            style={{
              backgroundColor: "#EDE0C8",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: "#7A5C2E",
                letterSpacing: 0.5,
              }}
            >
             3 days of peace
            </Text>
          </View>

          <View className="flex-row items-end">
            <Text
              style={{
                fontSize: 44,
                fontWeight: "500",
                color: "#3D3528",
              }}
            >
              $14
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#9A9080",
                marginBottom: 6,
              }}
            >
              /month
            </Text>
          </View>

          <Text
            style={{
              marginTop: 2,
              fontSize: 13,
              color: "#7A7060",
              textAlign: "center",
            }}
          >
            After trial, continue your journey for $14/month
          </Text>
        </LinearGradient>

        {/* CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          {/* Feature pills */}
          <View
            className="flex-row"
            style={{
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 16,
              columnGap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "#EDE6D6",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "500",
                  color: "#3D3528",
                }}
              >
                10
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#7A7060",
                  marginTop: 2,
                }}
              >
               confessions / month
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#EDE6D6",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "500",
                  color: "#3D3528",
                }}
              >
                40 min
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#7A7060",
                  marginTop: 2,
                }}
              >
                time for reflection
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View
            style={{
              height: 0.5,
              backgroundColor: "#DDD5C0",
              marginHorizontal: 24,
              marginBottom: 18,
            }}
          />

          {/* Timeline */}
          <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <TimelineItem
              title="TODAY"
              text="Begin your first confession. Speak freely — He is listening."
              active
              marker="1"
              showLine
            />

            <TimelineItem
              title="DAY 2"
              text="Take a moment to reflect again and continue your journey."
              marker="2"
              showLine
            />

            <TimelineItem
              title="DAY 3"
              text="Continue your journey in faith, or cancel anytime with no charge. "
              marker="3"
            />
          </View>
        </ScrollView>

        {/* CTA */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: 4,
          }}
        >
          <Pressable
            onPress={handleStartTrial}
            disabled={isLoading}
            className="items-center"
            style={{
              backgroundColor: "#019863",
              borderRadius: 9999,
              paddingVertical: 15,
              width: "100%",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={{ fontSize: 16, fontWeight: "500", color: "#FFFFFF" }}
              >
                Begin My Confession
              </Text>
            )}
          </Pressable>

          <View
            className="flex-row items-center justify-center"
            style={{ marginTop: 10, columnGap: 6 }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#7A7060" />
            <Text
              style={{
                fontSize: 12,
                color: "#9A9080",
              }}
            >
              Private · No judgment · Cancel anytime
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Timeline Item ---------- */

function TimelineItem({
  title,
  text,
  active,
  marker,
  showLine,
}: {
  title: string;
  text: string;
  active?: boolean;
  marker: string;
  showLine?: boolean;
}) {
  return (
    <View className="flex-row" style={{ columnGap: 14 }}>
      <View style={{ width: 28, alignItems: "center" }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active ? "#019863" : "#EDE6D6",
          }}
        >
          {active ? (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "500", color: "#7A7060" }}>
              {marker}
            </Text>
          )}
        </View>
        {showLine && (
          <View
            style={{
              width: 1.5,
              flex: 1,
              backgroundColor: "#DDD5C0",
              marginVertical: 3,
            }}
          />
        )}
      </View>

      <View style={{ flex: 1, paddingBottom: 16 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "500",
            color: "#9A9080",
            letterSpacing: 0.5,
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 13, color: "#4A4235", lineHeight: 20 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}
