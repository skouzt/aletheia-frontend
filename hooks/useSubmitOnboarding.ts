import { useAuth, useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useOnboardingStore } from "../state/onboardingStore";
import { supabase } from "../utils/supabase";

export function useSubmitOnboarding() {
  const { userId } = useAuth();
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
        console.error("❌ No email found for user");
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
        user_id: userId,
        email: email || null,
      };


      // ✅ CHECK IF USER EXISTS FIRST (webhook might have created it)
      const { data: existingUser } = await supabase
        .from("user_info")
        .select("user_id, email")
        .eq("user_id", userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found

      let result;

      if (existingUser) {
        // ✅ User exists (created by webhook) - UPDATE it
        
        result = await supabase
          .from("user_info")
          .update(formData)
          .eq("user_id", userId)
          .select()
          .single();
      } else {
        // ✅ User doesn't exist - INSERT it
        
        result = await supabase
          .from("user_info")
          .insert(formData)
          .select()
          .single();
      }

      const { data: savedData, error } = result;

      if (error) {
        console.error("❌ Supabase error:", error);
        return {
          success: false,
          error: error.message,
        };
      }


      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      return {
        success: true,
        data: savedData,
      };
    } catch (err) {
      console.error("💥 Submit onboarding error:", err);
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