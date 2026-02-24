import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

const CACHE_KEY = "@aletheia_profile_";
const CACHE_TTL_MS = Number.MAX_SAFE_INTEGER;

interface ProfileData {
  name: string;
  age: string;
  gender: string;
  timestamp: number;
}

export default function Profile() {
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const hasLoaded = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null); // ✅ track controller

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [selectedAge, setSelectedAge] = useState("25–34");
  const [selectedGender, setSelectedGender] = useState("Woman");

  useEffect(() => {
    if (!userId) return;
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadProfile = async () => {
      const cacheKey = `${CACHE_KEY}${userId}`;

      try {
        const cached = await AsyncStorage.getItem(cacheKey);

        if (cached) {
          const parsed: ProfileData = JSON.parse(cached);
          const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS;

          if (!isExpired) {
            setName(parsed.name || "");
            setSelectedAge(parsed.age || "25–34");
            setSelectedGender(parsed.gender || "Woman");
            setLoading(false);
            return;
          }
        }

        await fetchProfileFromBackend(userId, true);
      } catch (error) {
        await fetchProfileFromBackend(userId, true);
      }
    };

    loadProfile();

    return () => {
      // ✅ abort any in-flight request on unmount
      abortControllerRef.current?.abort();
    };
  }, [userId]);

  const fetchProfileFromBackend = async (uid: string, showLoading: boolean) => {
    // ✅ abort previous request if still running
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (showLoading) setLoading(true);

    try {
      const token = await getToken({ template: "backend-api" });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          signal: controller.signal, // ✅ attach signal
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const profileData: ProfileData = {
        name: data.name || "",
        age: data.age || "25–34",
        gender: data.gender || "Woman",
        timestamp: Date.now(),
      };

      setName(profileData.name);
      setSelectedAge(profileData.age);
      setSelectedGender(profileData.gender);

      await AsyncStorage.setItem(`${CACHE_KEY}${uid}`, JSON.stringify(profileData));

    } catch (error) {
      if ((error as Error).name === "AbortError") return; // ✅ silently ignore aborts

      console.error("Failed to fetch profile:", error);
      if (showLoading) Alert.alert("Error", "Failed to load profile");
    } finally {
      // ✅ only update loading if this request wasn't aborted
      if (!controller.signal.aborted) {
        if (showLoading) setLoading(false);
      }
    }
  };

  const saveToCache = async () => {
    if (!userId) return;

    const profileData: ProfileData = {
      name: name.trim(),
      age: selectedAge,
      gender: selectedGender,
      timestamp: Date.now(),
    };

    try {
      await AsyncStorage.setItem(`${CACHE_KEY}${userId}`, JSON.stringify(profileData));
    } catch (error) {
      console.error("Cache save error:", error);
    }
  };

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken({ template: "backend-api" });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            age: selectedAge,
            gender: selectedGender,
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await saveToCache();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
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
          <LinearGradient
            colors={["#EAF6F1", "#F6F8F7"]}
            locations={[0, 1]}
          >
            <View className="items-center pt-3 pb-1">
              <View className="h-1.5 w-12 rounded-full bg-gray-300" />
            </View>

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
                className="w-10 h-10 rounded-full bg-white/60"
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

              <View style={{ width: 36 }} />
            </View>
          </LinearGradient>

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


             