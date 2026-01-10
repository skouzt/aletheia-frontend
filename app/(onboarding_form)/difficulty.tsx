import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const DIFFICULTY_OPTIONS = [
  "Stress from work / studies",
  "Relationship problems",
  "Loneliness / lack of support",
  "Anxiety / overthinking",
  "Low confidence / self-image",
  "Feeling sad or empty often",
  "Something else"
];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 2;

export default function CurrentDifficulty() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);
  const [selectedDifficulty, setSelectedDifficulty] = useState("Stress from work / studies");

  function handleSelect(option: string) {
    Haptics.selectionAsync(); // soft tick on selection
    setSelectedDifficulty(option);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // stronger tap on continue
    setValue("Current_Difficulty", selectedDifficulty);
    router.push("/(onboarding_form)/duration");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f7" }}>

      {/* Progress Dots */}
      <View style={{ paddingTop: 32 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                width: i === CURRENT_STEP - 1 ? 10 : 8,
                height: i === CURRENT_STEP - 1 ? 10 : 8,
                borderRadius: 9999,
                backgroundColor: i === CURRENT_STEP - 1 ? "#019863" : "#cfe7df"
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
          paddingBottom: 200
        }}
      >

        {/* Card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            paddingVertical: 32,
            paddingHorizontal: 20,
            width: "100%",
            maxWidth: 480,
            alignSelf: "center"
          }}
        >

          <Text
            style={{
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              textAlign: "center",
              color: "#0d1b16",
              marginBottom: 24
            }}
          >
            What's been most difficult for you recently?
          </Text>

          <View style={{ gap: 14 }}>
            {DIFFICULTY_OPTIONS.map((option) => {
              const selected = selectedDifficulty === option;
              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    borderWidth: 1.4,
                    borderColor: selected ? "#019863" : "#cfe7df",
                    backgroundColor: selected ? "rgba(1,152,99,0.08)" : "white",
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily: "LibreCaslonText-Regular",
                      fontSize: 15,
                      color: "#0d1b16"
                    }}
                  >
                    {option}
                  </Text>

                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 9999,
                      borderWidth: 2,
                      borderColor: selected ? "#019863" : "#cfe7df",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selected ? "#019863" : "transparent"
                    }}
                  >
                    {selected && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 9999,
                          backgroundColor: "#0d1b16"
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

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
          paddingBottom: 42,
          paddingTop: 20,
          backgroundColor: "#f6f8f7",
          borderTopWidth: 1,
          borderTopColor: "#dce5e2"
        }}
      >
        <TouchableOpacity
          onPress={handleNext}
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
              color: "white"
            }}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
