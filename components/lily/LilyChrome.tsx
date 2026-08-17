import { LilyColors } from '@/constants/lily';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LilyMenu, LilyMenuButton, LilyTab } from './LilyMenu';

/**
 * Wraps a screen with Lily's only navigation: the hamburger and its bottom sheet.
 * There is no tab bar in the design — every destination is reached from here.
 */
export function LilyChrome({
  activeTab,
  children,
}: {
  activeTab: LilyTab;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      {children}

      {/* Last child so it paints above screen content on Android. */}
      <LilyMenuButton onPress={() => setMenuOpen(true)} top={Math.max(insets.top, 20) + 14} />

      <LilyMenu visible={menuOpen} onClose={() => setMenuOpen(false)} activeTab={activeTab} />
    </View>
  );
}
