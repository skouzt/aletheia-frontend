import { useUser } from "@clerk/clerk-expo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Animated, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSubmitOnboarding } from "../../hooks/useSubmitOnboarding";
import { useOnboardingStore } from "../../state/onboardingStore";

const SAFETY_OPTIONS = ["No", "A few times before", "Yes, recently"];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 7;

export default function SafetyCheck() {
  const router = useRouter();
  const { user } = useUser();
  const setValue = useOnboardingStore((s) => s.setValue);

  const [selectedSafety, setSelectedSafety] = useState("Yes, recently");
  const [isCompleting, setIsCompleting] = useState(false);

  const { submitOnboarding, loading } = useSubmitOnboarding();

  function handleSelect(option: string) {
    Haptics.selectionAsync();
    setSelectedSafety(option);
    setValue("Safety_Check", option);
  }

  async function handleFinish() {
    if (isCompleting) return;

    // Save the current selection to store
    setValue("Safety_Check", selectedSafety);

    // Haptic feedback for button press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsCompleting(true);

    const result = await submitOnboarding();
    
    if (!result.success) {
      console.error("Insert failed:", result.error);
      
      // Show error alert to user
      Alert.alert(
        "Oops!",
        "We couldn't save your information. Please try again.",
        [{ text: "OK" }]
      );
      
      // Optional: Error haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsCompleting(false);
      return;
    }

    // Mark onboarding as complete in Clerk metadata
    try {
      await user?.update({
        unsafeMetadata: {
          onboardingComplete: true,
        },
      });

      // Reload user to ensure metadata is fresh
      await user?.reload();

      // Success! Navigate to loading screen
      router.replace("/loading");
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert(
        "Almost there!",
        "Your data was saved but we couldn't complete setup. Please restart the app.",
        [{ text: "OK" }]
      );
      setIsCompleting(false);
    }
  }

  const isLoading = loading || isCompleting;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F8F7" }}>
      {/* Progress Dots */}
      <View style={{ paddingTop: 24, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: index === CURRENT_STEP - 1 ? "#019863" : "#01986333",
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 140,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            backgroundColor: "white",
            borderRadius: 20,
            paddingVertical: 32,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              lineHeight: 34,
              textAlign: "center",
              color: "#111815",
              marginBottom: 32,
            }}
          >
            Have you ever felt like harming yourself or giving up?
          </Text>

          <View style={{ gap: 14 }}>
            {SAFETY_OPTIONS.map((option) => {
              const selected = selectedSafety === option;
              const scaleAnim = new Animated.Value(1);

              return (
                <TouchableWithoutFeedback
                  key={option}
                  onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
                  onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
                  onPress={() => handleSelect(option)}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      height: 56,
                      borderRadius: 18,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: selected ? "rgba(1,152,99,0.15)" : "#EFEFEF",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#019863" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "LibreCaslonText-Bold",
                        fontSize: 16,
                        color: selected ? "#019863" : "#111815",
                      }}
                    >
                      {option}
                    </Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>

          {selectedSafety === "Yes, recently" && (
            <Text
              style={{
                fontFamily: "LibreCaslonText-Regular",
                textAlign: "center",
                color: "#111815",
                fontSize: 15,
                marginTop: 24,
              }}
            >
              I'm here for you. I'll guide you to safe help now.
            </Text>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 42,
          backgroundColor: "#F6F8F7",
          borderTopWidth: 1,
          borderTopColor: "#DCE5E2",
        }}
      >
        <TouchableWithoutFeedback onPress={handleFinish} disabled={isLoading}>
          <View
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: "#019863",
              justifyContent: "center",
              alignItems: "center",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                fontFamily: "LibreCaslonText-Bold",
                color: "white",
                fontSize: 16,
              }}
            >
              {isLoading ? "Saving..." : "Finish"}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}