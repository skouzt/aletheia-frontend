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

      // Create checkout for Guided plan ($15)
      const res = await fetch(`${API_URL}/api/v1/billing/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_key: "guided", // $15 plan
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
      <View className="w-full max-w-md bg-white rounded-[28px] overflow-hidden">

        {/* Header with gradient */}
        <LinearGradient
          colors={["#dcfce7", "#effdf4", "#ffffff"]}
          className="pt-12 pb-6 items-center relative"
        >
          {/* Close */}
          <Pressable
            onPress={handleClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/5 items-center justify-center"
          >
            <Ionicons name="close" size={18} color="#5e8d7c" />
          </Pressable>

          {/* Animation Space */}
        <View className="items-center pt-8 pb-6">
            <Image
                    source={require("@/assets/images/trial.png")}
                    resizeMode="contain"
                    className="w-84 h-40 opacity-90"
                    style={{
                        shadowColor: "#7fcfb6",
                        shadowOpacity: 0.12,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                    }}
                    />

        </View>
        </LinearGradient>

        {/* CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        >
          {/* Title */}
          <View className="items-center mb-8">
            <Text className="text-[30px] font-bold text-[#101816] text-center mb-3">
              How your trial works
            </Text>
            <Text className="text-base text-[#5e8d7c] text-center leading-relaxed">
              First 7 days free, then $15/month.{"\n"}Cancel anytime.
            </Text>
          </View>

          {/* Timeline */}
          <TimelineItem
            icon="lock-open-outline"
            title="Today"
            text="Unlock full access to mindful conversations (60 min/day)."
            showLine
          />

          <TimelineItem
            icon="notifications-outline"
            title="Day 5"
            text="We’ll send you a reminder email so there are no surprises on your bill."
            showLine
          />

          <TimelineItem
            icon="checkmark-circle-outline"
            title="Day 7"
            text="Trial converts to subscription. Cancel before this day and pay nothing."
          />
        </ScrollView>

        {/* CTA */}
        <View className="px-6 pb-6 pt-2">
          <Pressable 
            onPress={handleStartTrial} 
            disabled={isLoading}
            className="bg-[#019863] py-4 rounded-full items-center mb-4"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white text-lg font-semibold">
                Start my free trial
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center gap-2 mb-3">
            <Ionicons name="checkmark-circle" size={16} color="#5e8d7c" />
            <Text className="text-xs text-[#5e8d7c]">
              No commitment. Cancel anytime in settings.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Timeline Item ---------- */

function TimelineItem({
  icon,
  title,
  text,
  showLine,
}: {
  icon: any;
  title: string;
  text: string;
  showLine?: boolean;
}) {
  return (
    <View className="flex-row gap-4 mb-6">
      <View className="items-center">
        <View className="h-10 w-10 rounded-full bg-[#019863]/10 items-center justify-center">
          <Ionicons name={icon} size={18} color="#019863" />
        </View>
        {showLine && (
          <View className="w-[2px] flex-1 bg-[#dae7e2] mt-1" />
        )}
      </View>

      <View className="flex-1 pt-1">
        <Text className="text-lg font-bold text-[#101816] mb-1">
          {title}
        </Text>
        <Text className="text-sm text-[#5e8d7c] leading-relaxed">
          {text}
        </Text>
      </View>
    </View>
  );
}