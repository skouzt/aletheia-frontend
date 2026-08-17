import { CloseX } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AGE_GROUPS = ['Under 18', '18–24', '25–34', '35–44', '45+'];
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];

const CACHE_KEY = '@aletheia_profile_';
const CACHE_TTL_MS = Number.MAX_SAFE_INTEGER;

interface ProfileData {
  name: string;
  age: string;
  gender: string;
  timestamp: number;
}

/** Section label above each group of controls. */
function FieldLabel({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text
      style={[
        {
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          fontFamily: LilyFonts.sansSemi,
          color: LilyColors.textMuted,
          marginBottom: 10,
        },
        style as never,
      ]}
    >
      {children}
    </Text>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, getToken } = useAuth();

  const hasLoaded = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [selectedAge, setSelectedAge] = useState('25–34');
  const [selectedGender, setSelectedGender] = useState('Woman');

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 300);
  };

  const fetchProfileFromBackend = useCallback(
    async (uid: string, showLoading: boolean) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (showLoading) setLoading(true);

      try {
        const token = await getToken({ template: 'backend-api' });

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        const profileData: ProfileData = {
          name: data.name || '',
          age: data.age || '25–34',
          gender: data.gender || 'Woman',
          timestamp: Date.now(),
        };

        setName(profileData.name);
        setSelectedAge(profileData.age);
        setSelectedGender(profileData.gender);

        await AsyncStorage.setItem(`${CACHE_KEY}${uid}`, JSON.stringify(profileData));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;

        console.error('Failed to fetch profile:', error);
        if (showLoading) Alert.alert('Error', 'Failed to load profile');
      } finally {
        if (!controller.signal.aborted && showLoading) setLoading(false);
      }
    },
    [getToken],
  );

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
            setName(parsed.name || '');
            setSelectedAge(parsed.age || '25–34');
            setSelectedGender(parsed.gender || 'Woman');
            setLoading(false);
            return;
          }
        }

        await fetchProfileFromBackend(userId, true);
      } catch {
        await fetchProfileFromBackend(userId, true);
      }
    };

    loadProfile();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [userId, fetchProfileFromBackend]);

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
      console.error('Cache save error:', error);
    }
  };

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Add your name', 'Lily uses it to talk to you.');
      return;
    }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken({ template: 'backend-api' });

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/users/profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          age: selectedAge,
          gender: selectedGender,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      await saveToCache();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: LilyColors.scrim }}>
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          style={{
            height: '92%',
            overflow: 'hidden',
            backgroundColor: LilyColors.ground,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderTopColor: LilyColors.hairlineBright,
          }}
        >
          {/* Grabber */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{ height: 4, width: 38, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)' }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 8,
              paddingBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily: LilyFonts.serif,
                fontSize: 30,
                color: LilyColors.textPrimary,
              }}
            >
              Your Profile
            </Text>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={10}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: LilyColors.ghostFill,
              }}
            >
              <CloseX />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={LilyColors.accent} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
            >
              <FieldLabel>Name</FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What should Lily call you?"
                placeholderTextColor={LilyColors.textFaint}
                style={{
                  height: 52,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  fontSize: 15,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textPrimary,
                  backgroundColor: LilyColors.surface,
                  borderWidth: 1,
                  borderColor: LilyColors.hairline,
                }}
              />

              <FieldLabel style={{ marginTop: 28 }}>Age</FieldLabel>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {AGE_GROUPS.map((age) => {
                  const on = selectedAge === age;
                  return (
                    <TouchableOpacity
                      key={age}
                      onPress={() => setSelectedAge(age)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 100,
                        backgroundColor: on ? LilyColors.accentWash : LilyColors.surface,
                        borderWidth: 1,
                        borderColor: on ? LilyColors.accent : LilyColors.hairline,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontFamily: on ? LilyFonts.sansSemi : LilyFonts.sans,
                          color: on ? LilyColors.textPrimary : LilyColors.textBody,
                        }}
                      >
                        {age}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <FieldLabel style={{ marginTop: 28 }}>Gender</FieldLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {GENDERS.map((gender) => {
                  const on = selectedGender === gender;
                  return (
                    <TouchableOpacity
                      key={gender}
                      onPress={() => setSelectedGender(gender)}
                      style={{
                        width: '47.5%',
                        flexGrow: 1,
                        height: 52,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? LilyColors.accentWash : LilyColors.surface,
                        borderWidth: 1,
                        borderColor: on ? LilyColors.accent : LilyColors.hairline,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: on ? LilyFonts.sansSemi : LilyFonts.sans,
                          color: on ? LilyColors.textPrimary : LilyColors.textBody,
                        }}
                      >
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Footer */}
          <View
            style={{
              paddingHorizontal: 22,
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              backgroundColor: LilyColors.ground,
              borderTopWidth: 1,
              borderTopColor: LilyColors.hairline,
            }}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || loading}
              style={{
                height: 54,
                borderRadius: 100,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: saving || loading ? 'rgba(63,191,127,0.3)' : LilyColors.accent,
              }}
            >
              {saving ? (
                <ActivityIndicator color={LilyColors.ground} />
              ) : (
                <Text
                  style={{ fontSize: 16, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
