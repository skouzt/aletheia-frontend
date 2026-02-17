import { useClerk } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as Notifications from "expo-notifications";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
  subtitle?: string;
  rightText?: string;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
}
async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function SettingItem({
  icon,
  title,
  onPress,
  subtitle,
  rightText,
  showToggle,
  toggleValue,
  onToggleChange,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      className="flex-row items-center gap-3 bg-white rounded-xl px-3 py-3 justify-between mb-2"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-4 flex-1">
        {icon && (
          <View className="flex items-center justify-center rounded-lg bg-secondary shrink-0 w-10 h-10">
            <Ionicons name={icon} size={20} color="#019863" />
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-text-light text-sm"
            style={{ fontFamily: 'LibreCaslonText-Regular' }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              className="text-meta-light text-xs mt-0.5"
              style={{ fontFamily: 'LibreCaslonText-Regular' }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View className="shrink-0">
        {showToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            trackColor={{ false: '#E5E7EB', true: '#019863' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        ) : rightText ? (
          <View className="flex-row items-center gap-1">
            <Text
              className="text-meta-light text-xs"
              style={{ fontFamily: 'LibreCaslonText-Regular' }}
            >
              {rightText}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#499c7f" />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#499c7f" />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { signOut } = useClerk();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<"Daily" | "Weekdays">("Daily");
  const [showFrequencyOptions, setShowFrequencyOptions] = useState(false);

  const handleToggleNotifications = async (value: boolean) => {
  if (value) {
    const granted = await requestNotificationPermission();

    if (!granted) {
      Alert.alert(
        "Notifications Disabled",
        "Please enable notifications from your device settings to receive reminders."
      );
      return;
    }
  }

  setNotificationsEnabled(value);
};

  const handleSignOut = async () => {
    try {
      await signOut();
      Linking.openURL(Linking.createURL('/'));
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header (no back button now) */}
      <View className="px-4 py-3 bg-background-light ">
        <View className="flex-row items-center justify-center">
          <Text
            className="text-text-light text-lg font-bold "
            style={{ fontFamily: 'LibreCaslonText-Bold' }}
          >
            Settings
          </Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="flex-1 px-4 pb-24"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Account Section */}
        <Text
          className="text-charcoal-text text-base font-bold pt-5 pb-3"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Account
        </Text>
        <View className="mb-2">
          <SettingItem
              icon="person-outline"
              title="Your Profile"
              onPress={() => router.push('/(profile)')}
            />
          <SettingItem
            icon="card-outline"
            title="Subscription"
            onPress={() => router.push('/(subscription)')}
          />
          <SettingItem
            icon="hourglass-outline"
            title="Sessions & Usage"
            onPress={() => router.push('/(session)')}
          />
        </View>

        {/* Privacy Section */}
        <Text
          className="text-charcoal-text text-base font-bold pt-5 pb-3"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Privacy
        </Text>
        <View className="mb-2">
          <SettingItem
            icon="document-text-outline"
            title="Data Privacy Policy"
            onPress={() => router.push('/(privacy)')}
          />
          <SettingItem
            icon="settings-outline"
            title="Manage Your Data"
           onPress={() => router.push('/(managedata)')}
          />
        </View>

        {/* Notifications Section */}
      <Text
        className="text-charcoal-text text-base font-bold pt-5 pb-3"
        style={{ fontFamily: "LibreCaslonText-Bold" }}
      >
        Notifications
      </Text>

      <View className="mb-2">
        <SettingItem
          icon="notifications-outline"
          title="Enable Notifications"
          subtitle="Adjust your daily check-in reminders"
          showToggle
          toggleValue={notificationsEnabled}
          onToggleChange={handleToggleNotifications}
        />

        <SettingItem
          icon="time-outline"
          title="Frequency"
          rightText={frequency}
          onPress={
            notificationsEnabled
              ? () => setShowFrequencyOptions((prev) => !prev)
              : undefined
          }
        />


        {/* Inline frequency options */}
        {notificationsEnabled && showFrequencyOptions && (
          <View className="mt-2 ml-12 mr-2 bg-white rounded-xl p-3 shadow-sm">
            {["Daily", "Weekdays"].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setFrequency(option as typeof frequency);
                  setShowFrequencyOptions(false);
                }}
                className="py-3 flex-row justify-between items-center"
              >
                <Text className="text-sm text-gray-700">{option}</Text>
                {frequency === option && (
                  <Ionicons name="checkmark" size={18} color="#019863" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>


        {/* App Info Section */}
        <Text
          className="text-charcoal-text text-base font-bold pt-5 pb-3"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          About
        </Text>
        <View className="mb-2">
          <SettingItem
            icon="information-circle-outline"
            title="App Version"
            rightText="1.0.0"
          />
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => router.push('/(support)')}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mt-6 mb-4 h-12 rounded-xl items-center justify-center bg-white border border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
          }}
        >
          <Text
            className="text-sm font-bold"
            style={{ color: '#DC2626', fontFamily: 'LibreCaslonText-Bold' }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
