import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

export default function ManageDataScreen() {
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [visible, setVisible] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => router.back(), 320);
  };

  async function clearHistory() {
    if (!userId) return;

    setConfirmVisible(false);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken({ template: "backend-api" });
      
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/therapy/sessions/clear`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Session History Cleared",
        "Your past session summaries have been removed."
      );

      handleClose();
    } catch (error) {
      console.error("Failed to clear history:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-end bg-black/40">
      {visible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="rounded-t-[32px] overflow-hidden bg-[#F6F8F7]"
          style={{ height: "90%" }}
        >
          {/* ---------- HEADER ---------- */}
          <View className="relative pb-6 pt-2">
            <LinearGradient colors={["#EAF6F1", "#F6F8F7"]} className="absolute top-0 left-0 right-0 h-full" />

            <View className="items-center pt-3 pb-4">
              <View className="h-1.5 w-12 rounded-full bg-gray-300/80" />
            </View>

            {/* Close */}
            <Pressable
              onPress={handleClose} // ✅ Use handleClose instead of direct setVisible(false)
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/70 items-center justify-center"
            >
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>

            {/* Title */}
            <View className="items-center px-6 mt-2">
              <View className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm mb-4">
                <Ionicons name="shield-checkmark-outline" size={30} color="#019863" />
              </View>

              <Text className="text-3xl text-gray-900 mb-2 font-bold">
                Manage Your Data
              </Text>

              <Text className="text-base text-gray-600 text-center max-w-xs">
                You're in control of your session history.
              </Text>
            </View>
          </View>

          {/* ---------- CONTENT ---------- */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            className="px-6 pt-2"
          >
            {/* Action Card */}
            <View className="bg-[#FFFBF5] border border-[#F5E6CA] rounded-2xl p-6 shadow-sm mb-6">
              <View className="gap-4">
                <View>
                  <Text className="text-lg font-bold flex-row items-center gap-2 text-gray-900">
                    <Ionicons name="time-outline" size={18} color="#D97706" />{" "}
                    Clear Session History
                  </Text>

                  <Text className="text-[15px] text-gray-600 leading-relaxed mt-2">
                    This will remove your past session summaries from the app.
                    Your account will remain active.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setConfirmVisible(true)}
                  disabled={loading}
                  className="h-12 rounded-xl bg-white border border-gray-200 items-center justify-center active:scale-[0.98]"
                >
                  <Text className="font-bold text-gray-800">
                    {loading ? "Clearing..." : "Clear History"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Reassurance */}
            <View className="flex-row gap-3 px-2">
              <Ionicons name="information-circle-outline" size={18} color="#019863" style={{ marginTop: 2 }} />
              <Text className="text-sm text-gray-500 leading-relaxed">
                You'll be asked to confirm before this action is completed.
                No data is removed immediately.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ---------- CONFIRMATION DIALOG ---------- */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-2 text-gray-900">
              Clear Session History?
            </Text>

            <Text className="text-sm text-gray-600 leading-relaxed mb-6">
              This will permanently remove your past session summaries.
              This action cannot be undone.
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmVisible(false)}
                className="flex-1 h-12 rounded-xl bg-gray-100 items-center justify-center"
              >
                <Text className="font-semibold text-gray-700">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={clearHistory}
                className="flex-1 h-12 rounded-xl bg-[#019863] items-center justify-center"
              >
                <Text className="font-semibold text-white">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}