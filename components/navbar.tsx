import * as Haptics from "expo-haptics";
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface BottomNavBarProps {
  activeTab: "home" | "summary" | "setting";
  onTabPress: (tab: "home" | "summary" | "setting") => void;
}

export default function BottomNavBar({ activeTab, onTabPress }: BottomNavBarProps) {
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
    <View
      style={{
        position: "absolute",
        alignSelf: "center",
        bottom: 30,
      }}
    >
      {/* Compact white navbar */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 9999,
          paddingVertical: 4,
          paddingHorizontal: 4,
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {(["home", "summary", "setting"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const isSettings = tab === "setting";

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                onTabPress(tab);
              }}
              style={{
                flexDirection: isSettings && isActive ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                paddingHorizontal: isActive ? 16 : 12,
                backgroundColor: isActive ? "#019863" : "transparent",
                borderRadius: 9999,
                gap: 6,
              }}
            >
              <Image
                source={isActive ? icons[tab].selected : icons[tab].default}
                style={{
                  width: 22,
                  height: 22,
                  resizeMode: "contain",
                  tintColor: isActive ? "white" : "#9CA3AF",
                }}
              />

              {isActive && (
                <Text
                  style={{
                    color: "white",
                    fontSize: 13,
                    fontWeight: "500",
                    letterSpacing: 0.3,
                  }}
                >
                  {labels[tab]}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}