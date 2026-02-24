import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useOnboardingStore } from "../state/onboardingStore";

const CACHE_KEY = (userId: string) => `onboarding_status_${userId}`;

export function useSubmitOnboarding() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const submitOnboarding = async () => {
    try {
      setLoading(true);

      const data = useOnboardingStore.getState();

      if (!userId) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const email = user?.primaryEmailAddress?.emailAddress || 
                    user?.emailAddresses?.[0]?.emailAddress;

      if (!email) {
        console.error(" No email found for user");
      }

      const formData = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        support_style: data.support_style,
        Current_Difficulty: data.Current_Difficulty,
        Duration: data.Duration,
        Daily_Impact: data.Daily_Impact,
        Coping_Style: data.Coping_Style,
        Support_Network: data.Support_Network,
        Safety_Check: data.Safety_Check,
        email: email || null,
      };

      const token = await getToken({ template: "backend-api" });
      
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/onboarding`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const savedData = await response.json();

      await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(true));

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      return {
        success: true,
        data: savedData,
      };
    } catch (err) {
      console.error(" Submit onboarding error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    } finally {
      setLoading(false);
    }
  };

  return { submitOnboarding, loading };
}