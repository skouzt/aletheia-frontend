import { BlurView } from "expo-blur";
import React from 'react';
import { Image, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface BottomNavBarProps {
  activeTab: "home" | "summary" | "setting";
  onTabPress: (tab: "home" | "summary" | "setting") => void;
}

export default function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const icons = {
    home: {
      default: require("@/assets/icons/home.png"),
      selected: require("@/assets/icons/home-filled.png"),
    },
    summary: {
      default: require("@/assets/icons/scroll.png"),
      selected: require("@/assets/icons/scroll-filled.png"),
    },
    setting: {
      default: require("@/assets/icons/settings.png"),
      selected: require("@/assets/icons/settings-filled.png"),
    },
  };

  const labels = {
    home: "Home",
    summary: "Summary",
    setting: "Settings",
  };

  return (
    <View className="absolute self-center" style={{ bottom: 30 }}>
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? "dark" : "light"}
        className="flex-row items-center"
        style={{
          borderRadius: 9999,
          overflow: "hidden",
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.45)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
          padding: 7,
          gap: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.10,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        {(["home", "summary", "setting"] as const).map((tab) => {
          const isActive = activeTab === tab;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                onTabPress(tab);
              }}
              className="items-center justify-center"
              style={{
                flexDirection: "row",
                paddingVertical: 12,
                paddingHorizontal: isActive ? 20 : 16,
                backgroundColor: isActive
                  ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.88)")
                  : "transparent",
                borderRadius: 9999,
                gap: 8,
                ...(isActive && {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                }),
              }}
            >
              <Image
                source={isActive ? icons[tab].selected : icons[tab].default}
                style={{
                  width: 24,
                  height: 24,
                  resizeMode: "contain",
                  tintColor: isActive
                    ? "#019863"
                    : (isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"),
                }}
              />

              {isActive && (
                <Text
                  className="text-[14px] font-medium"
                  style={{
                    color: "#019863",
                    letterSpacing: 0.3,
                  }}
                >
                  {labels[tab]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}
