import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Animated, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const COPING_OPTIONS = [
  { icon: "forum", label: "I talk to someone" },
  { icon: "headphones", label: "I distract myself (music, games, etc.)" },
  { icon: "lock", label: "I keep it inside" },
  { icon: "question-mark", label: "I don't know how to handle it" }
];

const TOTAL_STEPS = 7;
const CURRENT_STEP = 5;

export default function CopingStyle() {
  const router = useRouter();
  const setValue = useOnboardingStore((s) => s.setValue);

  const [selectedCoping, setSelectedCoping] = useState("I distract myself (music, games, etc.)");

  function handleSelect(option: string) {
    Haptics.selectionAsync(); // soft tick
    setSelectedCoping(option);
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // stronger tap
    setValue("Coping_Style", selectedCoping);
    router.push("/(onboarding_form)/support");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f7" }}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingBottom: 160,
          paddingTop: 32
        }}
      >

        {/* Progress Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 28 }}>
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

        {/* CARD */}
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

          {/* Title */}
          <Text
            style={{
              fontFamily: "LibreCaslonText-Bold",
              fontSize: 28,
              lineHeight: 34,
              color: "#111815",
              textAlign: "center",
              marginBottom: 32
            }}
          >
            When it gets tough, what do you usually do?
          </Text>

          {/* Options */}
          <View style={{ gap: 14 }}>
            {COPING_OPTIONS.map((option) => {
              const selected = selectedCoping === option.label;
              const scaleAnim = new Animated.Value(1);

              const handlePressIn = () => {
                Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
              };

              const handlePressOut = () => {
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
              };

              return (
                <TouchableWithoutFeedback
                  key={option.label}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => handleSelect(option.label)}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderRadius: 20,
                      borderWidth: 1.4,
                      borderColor: selected ? "#019863" : "#dce5e2",
                      backgroundColor: selected ? "rgba(1,152,99,0.10)" : "white",
                    }}
                  >
                    <MaterialIcons
                      name={option.icon as any}
                      size={24}
                      color="#111815"
                      style={{ opacity: 0.75 }}
                    />

                    <Text
                      style={{
                        flex: 1,
                        fontFamily: "LibreCaslonText-Regular",
                        fontSize: 15,
                        color: "#111815"
                      }}
                    >
                      {option.label}
                    </Text>

                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        borderWidth: 2,
                        borderColor: selected ? "#019863" : "#dce5e2",
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
                            backgroundColor: "white"
                          }}
                        />
                      )}
                    </View>
                  </Animated.View>
                </TouchableWithoutFeedback>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
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
        <TouchableWithoutFeedback onPress={handleNext}>
          <View
            style={{
              height: 54,
              borderRadius: 18,
              backgroundColor: "#019863",
              alignItems: "center",
              justifyContent: "center"
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
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}
