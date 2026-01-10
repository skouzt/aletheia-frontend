import { supabase } from "@/utils/supabase";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

const AGE_GROUPS = ["Under 18", "18–24", "25–34", "35–44", "45+"];
const GENDERS = ["Woman", "Man", "Non-binary", "Prefer not to say"];

export default function Profile() {
  const router = useRouter();
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState("25–34");
  const [selectedGender, setSelectedGender] = useState("Woman");

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data } = await supabase
        .from("user_info")
        .select("name, age, gender")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setName(data.name || "");
        setSelectedAge(data.age || "25–34");
        setSelectedGender(data.gender || "Woman");
      }
      setLoading(false);
    })();
  }, [userId]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data: existing } = await supabase
        .from("user_info")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_info")
          .update({
            name: name.trim(),
            age: selectedAge,
            gender: selectedGender,
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("user_info").insert({
          user_id: userId,
          name: name.trim(),
          age: selectedAge,
          gender: selectedGender,
        });
      }

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      router.back();
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  

  return (
    <View className="flex-1 justify-end bg-black/40">
      <Animated.View
        entering={SlideInDown.duration(400)}
        exiting={SlideOutDown.duration(250)}
        className="rounded-t-[32px] overflow-hidden"
        style={{ height: "92%", backgroundColor: "#F6F8F7" }}
      >
        <View className="flex-1">
          {/* HEADER WITH GRADIENT */}
          <LinearGradient
            colors={["#EAF6F1", "#F6F8F7"]}
            locations={[0, 1]}
          >
            {/* Drag Handle */}
            <View className="items-center pt-3 pb-1">
              <View className="h-1.5 w-12 rounded-full bg-gray-300" />
            </View>

            {/* Header Row */}
            <View
              style={{
                height: 56,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={{
                  position: "absolute",
                  left: 16,
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={22} color="#111815" />
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: "LibreCaslonText-Bold",
                  fontSize: 18,
                  color: "#111815",
                }}
              >
                Your Profile
              </Text>

              {/* Spacer for symmetry */}
              <View style={{ width: 36 }} />
            </View>
          </LinearGradient>

          {/* CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 120,
            }}
          >
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="font-semibold mb-1">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                className="h-12 rounded-xl bg-gray-100 px-4 mb-5"
              />

              <Text className="font-semibold mb-2">Age</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {AGE_GROUPS.map((age) => (
                  <TouchableOpacity
                    key={age}
                    onPress={() => setSelectedAge(age)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      selectedAge === age
                        ? "bg-[#019863]"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selectedAge === age
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="font-semibold mt-5 mb-2">Gender</Text>
              <View className="flex-row flex-wrap gap-2">
                {GENDERS.map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    onPress={() => setSelectedGender(gender)}
                    className={`w-[48%] h-12 rounded-xl border items-center justify-center ${
                      selectedGender === gender
                        ? "border-[#019863]"
                        : "border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedGender === gender
                          ? "text-[#019863]"
                          : "text-gray-500"
                      }`}
                    >
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* SAVE BUTTON */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 20,
              backgroundColor: "#F6F8F7",
              borderTopWidth: 1,
              borderTopColor: "#E2E8E5",
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="h-12 rounded-full bg-[#019863] items-center justify-center"
            >
              <Text className="text-white font-bold">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
