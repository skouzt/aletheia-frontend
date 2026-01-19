import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

/* Enable LayoutAnimation on Android */
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------- FAQ DATA -------------------- */

const FAQS = [
  {
    q: "How does the AI therapist work?",
    a: "It uses advanced language models trained on therapeutic techniques to offer supportive, non-judgmental conversation tailored to your emotional needs.",
  },
  {
    q: "Is my data private and secure?",
    a: "Absolutely. We use strong encryption and do not share your personal data with third parties without consent.",
  },
  {
    q: "Are my conversations stored?",
    a: "Your conversations are stored locally for history. Anonymized data may be used to improve the AI, and you can opt out in Settings.",
  },
  {
    q: "Can I talk to a human therapist?",
    a: "Currently, this app is an AI-driven self-help tool. We do not offer direct access to human therapists at this time.",
  },
  {
    q: "How does the subscription work?",
    a: "Subscriptions are managed through your device’s app store. You can upgrade or cancel anytime from your subscription settings.",
  },
];

/* -------------------- SCREEN -------------------- */

export default function HelpSupportScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // ✅ FIX: Add exit animation handler
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 280);
  };

  function toggle(index: number) {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    setOpenIndex(openIndex === index ? null : index);
  }

  function emailSupport() {
    Linking.openURL("mailto:skouzt3@gmail.com");
  }

  return (
    <View className="flex-1 justify-end bg-black/40">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.ease))}
          className="rounded-t-[28px] overflow-hidden bg-[#F6F8F7]"
          style={{ height: "92%" }}
        >
          {/* Close */}
          <View className="absolute top-6 right-4 z-20">
            <Pressable
              onPress={handleClose} // ✅ Use handleClose
              className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#101816" />
            </Pressable>
          </View>

          {/* ---------- HEADER WITH GRADIENT ---------- */}
          <View className="relative">
            <LinearGradient
              colors={["#EAF6F1", "#F6F8F7"]}
              locations={[0, 1]}
              className="absolute top-0 left-0 right-0 h-[220px]"
            />

            <View className="pt-10 pb-8 items-center px-6">
              <Ionicons
                name="help-circle-outline"
                size={48}
                color="#019863"
                style={{ opacity: 0.4, marginBottom: 12 }}
              />

              <Text
                className="text-3xl text-[#0F172A] mb-3 text-center"
                style={{ fontFamily: "LibreCaslonText-Bold" }}
              >
                Help & Support
              </Text>

              <Text className="text-center text-gray-600 max-w-[280px]">
                We’re here to help you understand the app and get assistance.
              </Text>
            </View>
          </View>

          {/* ---------- CONTENT ---------- */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
            className="px-5"
          >
            {/* FAQ */}
            <Text
              className="text-lg mb-4 ml-1"
              style={{ fontFamily: "LibreCaslonText-Bold" }}
            >
              Frequently Asked Questions
            </Text>

            <View className="gap-3 mb-8">
              {FAQS.map((item, i) => (
                <View key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <Pressable
                    onPress={() => toggle(i)}
                    className="flex-row items-center justify-between p-4"
                  >
                    <Text className="text-sm font-semibold text-gray-800 flex-1 pr-2">
                      {item.q}
                    </Text>
                    <Ionicons
                      name={openIndex === i ? "chevron-up" : "chevron-down"}
                      size={18}
                      color="#9CA3AF"
                    />
                  </Pressable>

                  {openIndex === i && (
                    <View className="px-4 pb-4">
                      <Text className="text-sm text-gray-500 leading-relaxed">
                        {item.a}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* CONTACT SUPPORT */}
            <View className="bg-white rounded-2xl p-6 items-center shadow-sm relative overflow-hidden">
              <Text
                className="text-lg mb-1"
                style={{ fontFamily: "LibreCaslonText-Bold" }}
              >
                Still need help?
              </Text>

              <Text className="text-sm text-gray-500 mb-6 text-center">
                Our team is ready to assist you.
              </Text>

              <Pressable
                onPress={emailSupport}
                className="w-full h-14 rounded-full bg-[#019863] items-center justify-center flex-row gap-2"
              >
                <Ionicons name="mail" size={18} color="#fff" />
                <Text className="text-white font-semibold">
                  Email Support
                </Text>
              </Pressable>

              <Text className="text-xs text-gray-400 mt-4">
                We usually respond within 24–48 hours.
              </Text>

              <View className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#019863]/5 blur-2xl" />
              <View className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-[#019863]/5 blur-2xl" />
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}