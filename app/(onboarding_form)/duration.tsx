import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const DURATION_OPTIONS = [
  "A few days",
  "A few weeks",
  "A few months",
  "More than a year"
];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 3;

export default function Duration() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  
  const [selectedDuration, setSelectedDuration] = useState("A few weeks");

  function handleSelect(option: string) {
    Haptics.selectionAsync(); // subtle tick feedback
    setSelectedDuration(option);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // stronger press feedback
    setValue("Duration", selectedDuration);
    router.push("/(onboarding_form)/impact");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>

        {/* CARD */}
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            alignSelf: "center",
            backgroundColor: "white",
            borderRadius: 20,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 32,
          }}
        >

          {/* Progress Dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 28 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: index === CURRENT_STEP - 1 ? "#019863" : "#E5E7EB"
                }}
              />
            ))}
          </View>

          {/* Title */}
          <Text
            style={{
              textAlign: "center",
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              lineHeight: 34,
              color: "#333333",
              marginBottom: 32,
            }}
          >
            How long has this been affecting you?
          </Text>

          {/* Options */}
          <View style={{ gap: 12 }}>
            {DURATION_OPTIONS.map((option) => {
              const selected = selectedDuration === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? "#019863" : "#F0F2F5",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "LibreCaslonText-Regular",
                      fontSize: 16,
                      color: selected ? "white" : "#333333"
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </View>

      {/* Footer Button */}
      <View
        style={{
          backgroundColor: "#F9F9F9",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.05)",
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <View style={{ maxWidth: 480, width: "100%", alignSelf: "center" }}>
          <TouchableOpacity
            onPress={handleNext}
            style={{
              height: 56,
              borderRadius: 16,
              backgroundColor: "#019863",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "white",
                fontFamily: "LibreCaslonText-Bold",
                fontSize: 16,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
