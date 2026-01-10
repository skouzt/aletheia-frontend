import { Ionicons } from '@expo/vector-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const IMPACT_OPTIONS = [
  { icon: "analytics-outline", label: "Hard to focus / be productive" },
  { icon: "sad-outline", label: "Mood changes a lot" },
  { icon: "moon-outline", label: "Trouble sleeping" },
  { icon: "people-outline", label: "Avoiding people or conversations" },
  { icon: "barbell-outline", label: "Feels heavy but still managing" },
  { icon: "help-circle-outline", label: "Not sure" }
];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 4;

export default function DailyImpact() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>([]);

  function toggleImpact(label: string) {
    setSelectedImpacts((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setValue("Daily_Impact", selectedImpacts.join(", "));
    router.push("/(onboarding_form)/coping");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f7" }}>

      {/* Progress Dots */}
      <View style={{ paddingTop: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                backgroundColor: index === CURRENT_STEP - 1 ? "#019863" : "#dce5e2"
              }}
            />
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 200,
        }}
      >

        {/* CARD */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            paddingVertical: 32,
            paddingHorizontal: 20,
            width: "100%",
            maxWidth: 480,
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              textAlign: "center",
              lineHeight: 34,
              color: "#111815",
              marginBottom: 28,
            }}
          >
            How is this affecting your daily life?
          </Text>

          <View style={{ gap: 14, marginBottom: 18 }}>
            {IMPACT_OPTIONS.map((option) => {
              const isSelected = selectedImpacts.includes(option.label);
              const scaleAnim = new Animated.Value(1);

              const handlePressIn = () => {
                Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
              };

              const handlePressOut = () => {
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
              };

              const handlePress = () => {
                Haptics.selectionAsync();
                toggleImpact(option.label);
              };

              return (
                <TouchableWithoutFeedback
                  key={option.label}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      borderWidth: 1.4,
                      borderColor: isSelected ? "#019863" : "#dce5e2",
                      backgroundColor: isSelected ? "#019863" : "white",
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? "#ffffff" : "#019863"}
                    />
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: "LibreCaslonText-Regular",
                        fontSize: 15,
                        color: isSelected ? "#ffffff" : "#111815",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>

          <Text
            style={{
              fontFamily: "LibreCaslonText-Regular",
              fontSize: 16,
              color: "#6b7280",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Select all that apply.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 42,
          backgroundColor: "#f6f8f7",
          borderTopWidth: 1,
          borderTopColor: "#dce5e2",
        }}
      >
        <TouchableWithoutFeedback onPress={handleNext}>
          <View
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: "#019863",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "LibreCaslonText-Bold",
                fontSize: 16,
                color: "white",
              }}
            >
              Next
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}
