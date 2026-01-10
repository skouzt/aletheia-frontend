import { Ionicons } from '@expo/vector-icons';
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboardingStore } from "../../state/onboardingStore";

const AGE_OPTIONS = ["Under 18", "18–24", "25–34", "35–44", "45+"];
const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
const SUPPORT_OPTIONS = ["Just listen", "Offer suggestions", "Help me set goals"];

export default function PersonalDetails() {
  const router = useRouter();
  const setValue = useOnboardingStore(s => s.setValue);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [support, setSupport] = useState("");

  const isFormValid = name && age && gender && support;

  function handleSelect(setter: (v: string) => void, value: string) {
    Haptics.selectionAsync();
    setter(value);
  }

  function handleContinue() {
    if (!isFormValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Continue button feedback
    setValue("name", name);
    setValue("age", age);
    setValue("gender", gender);
    setValue("support_style", support);
    router.push("/(onboarding_form)/difficulty");
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      
      {/* Title */}
      <View className="px-6 pt-6 pb-2">
        <Text
          className="text-text-light text-lg font-bold text-center"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Personal Details
        </Text>
      </View>

      {/* Progress Dots */}
      <View className="flex-row items-center justify-center gap-2.5 py-3 px-4">
        {[0,1,2,3,4,5,6].map((i) => (
          <View
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              backgroundColor: i === 0 ? "#019863" : "#e7eff3"
            }}
          />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        
        <Text
          className="text-text-light text-[32px] font-bold leading-tight px-6 pt-8 pb-4 text-center"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Let’s get to know you a little.
        </Text>

        <View className="px-6 gap-8">
          
          {/* Name */}
          <View className="gap-2">
            <Text
              className="text-text-light text-lg font-bold"
              style={{ fontFamily: 'LibreCaslonText-Bold' }}
            >
              Name
            </Text>

            <View
              className="h-14 rounded-xl px-4 justify-center"
              style={{ backgroundColor: "#e7eff3" }}
            >
              <TextInput
                placeholder="What should I call you?"
                placeholderTextColor="#000000"
                value={name}
                onChangeText={setName}
                className="text-base text-text-light"
                style={{ fontFamily: 'LibreCaslonText-Regular', padding: 0 }}
              />
            </View>
          </View>

          {/* Age */}
          <View className="gap-3">
            <Text className="text-text-light text-lg font-bold" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
              Age
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {AGE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(setAge, opt)}
                  className="rounded-lg px-4 py-3 items-center justify-center"
                  style={{
                    width: "31.5%",
                    backgroundColor: age === opt ? "#019863" : "#e7eff3"
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: age === opt ? "white" : "#0d171b",
                      fontFamily: 'LibreCaslonText-Regular'
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gender */}
          <View className="gap-3">
            <Text className="text-text-light text-lg font-bold" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
              Gender
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(setGender, opt)}
                  className="rounded-lg px-4 py-3 items-center justify-center"
                  style={{
                    width: "48%",
                    backgroundColor: gender === opt ? "#019863" : "#e7eff3"
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: gender === opt ? "white" : "#0d171b",
                      fontFamily: 'LibreCaslonText-Regular'
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Support Style */}
          <View className="gap-3">
            <Text className="text-text-light text-lg font-bold" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
              How can we best support you?
            </Text>
            <View className="gap-2">
              {SUPPORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(setSupport, opt)}
                  className="rounded-lg px-4 h-14 flex justify-center"
                  style={{
                    backgroundColor: support === opt ? "#019863" : "#e7eff3"
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: support === opt ? "white" : "#0d171b",
                      fontFamily: 'LibreCaslonText-Regular'
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Footer */}
      <View className="absolute bottom-0 w-full bg-background-light pt-4 pb-6 px-6 items-center gap-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isFormValid}
          className="w-full max-w-md rounded-xl py-4 px-6"
          style={{ backgroundColor: isFormValid ? "#019863" : "#01986380" }}
        >
          <Text className="text-base font-bold text-white text-center" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
            Continue
          </Text>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',   // 🔑 THIS IS THE KEY
            maxWidth: '100%',   // 🔑 IMPORTANT
          }}
        >
          <Ionicons name="lock-closed" size={15} color="#4c809a" />
          <Text
            style={{
              fontFamily: 'LibreCaslonText-Regular',
              color: '#4c809a',
              fontSize: 12,
              flexShrink: 1,     // 🔑 REQUIRED
            }}
          >
            Your data is private and secure
          </Text>
        </View>

      </View>

    </SafeAreaView>
  );
}
