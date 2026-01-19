import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const SUPPORT_OPTIONS = [
  "Yes, usually",
  "Sometimes",
  "Not really",
  "No, I feel alone in it"
];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 6;

export default function SupportNetwork() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selectedSupport, setSelectedSupport] = useState("Sometimes");

  function handleSelect(option: string) {
    Haptics.selectionAsync(); // soft tick on selection
    setSelectedSupport(option);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // stronger tap for screen transition
    setValue("Support_Network", selectedSupport);
    router.push("/(onboarding_form)/safety");
  }

  return (
   <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f7" }}>

        {/* Progress Dots (NOW in correct position) */}
        <View style={{ paddingTop: 32, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === CURRENT_STEP - 1 ? 10 : 8,
                  height: index === CURRENT_STEP - 1 ? 10 : 8,
                  borderRadius: 9999,
                  backgroundColor: index === CURRENT_STEP - 1 ? "#019863" : "rgba(17,24,21,0.2)"
                }}
              />
            ))}
          </View>
        </View>


      {/* Main Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 200,
        }}
      >

        {/* Card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            paddingVertical: 32,
            paddingHorizontal: 16,
            width: "100%",
            maxWidth: 480,
          }}
        >

          <Text
            style={{
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              lineHeight: 34,
              color: "#111815",
              textAlign: "center",
              marginBottom: 24
            }}
          >
            Do you have someone you can talk to when you feel low?
          </Text>

          <View style={{ gap: 12, width: "100%", maxWidth: 480, alignSelf: "center" }}>
            {SUPPORT_OPTIONS.map((option) => {
              const selected = selectedSupport === option;
              const scaleAnim = new Animated.Value(1);

              const handlePressIn = () => {
                Animated.spring(scaleAnim, {
                  toValue: 0.97,
                  useNativeDriver: true
                }).start();
              };

              const handlePressOut = () => {
                Animated.spring(scaleAnim, {
                  toValue: 1,
                  useNativeDriver: true
                }).start();
              };

              return (
                <TouchableWithoutFeedback
                  key={option}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => handleSelect(option)}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      height: 56,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected ? "#019863" : "#f0f4f3",
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? "#019863" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "LibreCaslonText-Bold",
                        fontSize: 16,
                        color: selected ? "white" : "#111815"
                      }}
                    >
                      {option}
                    </Text>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 42,
        backgroundColor: "#f6f8f7",
        borderTopWidth: 1,
        borderTopColor: "#dce5e2"
      }}>
        <TouchableWithoutFeedback onPress={handleNext}>
          <View style={{
            height: 54,
            borderRadius: 18,
            backgroundColor: "#019863",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Text
              style={{
                fontFamily: "LibreCaslonText-Bold",
                fontSize: 16,
                color: "white"
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
