import { LilyColors, LilyFonts } from '@/constants/lily';
import { useSubscription } from '@/hooks/useSubscription';
import { Href, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { BlurView } from 'expo-blur';
import {
  Dimensions,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export type LilyTab = 'chat' | 'days' | 'space' | 'plan';

const NAV_ITEMS: {
  key: LilyTab;
  icon: string;
  label: string;
  sub: string;
  route: Href;
}[] = [
  { key: 'chat', icon: '🪷', label: 'Talk to Lily', sub: 'Your ongoing conversation', route: '/(chat)' },
  { key: 'days', icon: '🌱', label: 'Summaries & Insights', sub: 'A gentle look back', route: '/summary' },
  { key: 'space', icon: '⚙️', label: 'Settings', sub: 'Account, privacy, notifications', route: '/setting' },
  { key: 'plan', icon: '🌷', label: 'Lily Unlimited', sub: 'Start your 3-day free trial', route: '/paywall' },
];

function CloseIcon({ color = LilyColors.textMuted }: { color?: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
      <Path d="M1 1l12 12M13 1L1 13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * The menu button. Absolutely positioned top-left, sits above screen content.
 * Hidden on the paywall, matching `showMenuBtn` in the design doc.
 */
export function LilyMenuButton({ onPress, top = 54 }: { onPress: () => void; top?: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={10}
      style={{
        position: 'absolute',
        top,
        left: 16,
        zIndex: 8,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: LilyColors.surfaceButtonRaised,
        borderWidth: 1,
        borderColor: LilyColors.hairlineFaint,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        // Android needs elevation, not just zIndex, to paint above siblings.
        elevation: 12,
      }}
    >
      <View style={{ width: 13, height: 1.5, borderRadius: 2, backgroundColor: LilyColors.icon }} />
      <View style={{ width: 13, height: 1.5, borderRadius: 2, backgroundColor: LilyColors.icon }} />
    </TouchableOpacity>
  );
}

function NavRow({
  item,
  active,
  onPress,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: active
          ? LilyColors.accentWash
          : 'transparent',
      }}
    >
      <Text style={{ fontSize: 17, width: 22, textAlign: 'center', opacity: active ? 1 : 0.75 }}>
        {item.icon}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: active ? LilyFonts.sansSemi : LilyFonts.sansMedium,
            color: active ? LilyColors.textPrimary : LilyColors.textBody,
          }}
        >
          {item.label}
        </Text>
        <Text
          style={{
            fontSize: 11.5,
            fontFamily: LilyFonts.sans,
            color: active ? LilyColors.textMuted : LilyColors.textFaint,
            marginTop: 2,
          }}
        >
          {item.sub}
        </Text>
      </View>
      {active && (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: LilyColors.accentDeep }} />
      )}
    </TouchableOpacity>
  );
}

function QuietRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: 'transparent',
      }}
    >
      <Text style={{ fontSize: 15, width: 22, textAlign: 'center', opacity: 0.75 }}>{icon}</Text>
      <Text style={{ fontSize: 14, fontFamily: LilyFonts.sans, color: LilyColors.textBody }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function LilyMenu({
  visible,
  onClose,
  activeTab,
  onNewConversation,
}: {
  visible: boolean;
  onClose: () => void;
  activeTab: LilyTab;
  onNewConversation?: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, loading: subLoading } = useSubscription();

  // Driven by hand rather than by `SlideInDown`: entering animations inside a Modal
  // can settle a frame short on Android, which left the screen behind peeking out.
  const travel = Dimensions.get('window').height;
  const offset = useSharedValue(travel);

  useEffect(() => {
    if (visible) {
      offset.value = travel;
      offset.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    }
  }, [visible, travel, offset]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  // Once someone has subscribed, "Lily Unlimited — start your 3-day free trial" is
  // both wrong and slightly insulting: they already did. Billing lives in Settings →
  // Subscription from then on. Hidden while loading so it can't flash in and out.
  const navItems = NAV_ITEMS.filter(
    (item) => item.key !== 'plan' || (!subLoading && plan === 'none'),
  );

  const go = (route: Href) => {
    onClose();
    // Let the sheet dismiss before the navigation swap.
    requestAnimationFrame(() => router.push(route));
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View entering={FadeIn.duration(250)} style={StyleSheet.absoluteFill}>
          <TouchableOpacity onPress={onClose} activeOpacity={1} style={{ flex: 1 }}>
            <BlurView intensity={18} tint="dark" style={{ flex: 1 }}>
              <View style={{ flex: 1, backgroundColor: LilyColors.scrim }} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              // Overshoots the bottom edge so no sliver of the screen behind can show
              // through; the extra height is absorbed by the list's bottom padding.
              bottom: -40,
              paddingBottom: 40,
              maxHeight: '88%',
              backgroundColor: LilyColors.ground,
              borderTopWidth: 1,
              borderTopColor: LilyColors.hairlineBright,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -20 },
              shadowOpacity: 0.6,
              shadowRadius: 50,
              elevation: 24,
            },
            sheetStyle,
          ]}
        >
          {/* Grabber */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View
              style={{ width: 38, height: 4, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)' }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              paddingTop: 12,
              paddingHorizontal: 22,
              paddingBottom: 14,
            }}
          >
            <Text style={{ flex: 1, fontFamily: LilyFonts.serif, fontSize: 24, color: LilyColors.textPrimary }}>
              Lily
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={10}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
              }}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 10, gap: 6 }}>
              {navItems.map((item) => (
                <NavRow
                  key={item.key}
                  item={item}
                  active={activeTab === item.key}
                  onPress={() => go(item.route)}
                />
              ))}
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.1)',
                marginVertical: 10,
                marginHorizontal: 22,
              }}
            />

            <View style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
              <QuietRow
                icon="✏️"
                label="Start a new conversation"
                onPress={() => {
                  onClose();
                  onNewConversation?.();
                }}
              />
              <QuietRow icon="🔒" label="Privacy & memory" onPress={() => go('/(privacy)')} />
              <QuietRow icon="🌸" label="How Lily talks to me" onPress={() => go('/(personalization)')} />
            </View>

            <View style={{ flex: 1, minHeight: 14 }} />

            {/* Crisis card — deliberately quiet, never alarming */}
            <View
              style={{
                margin: 14,
                paddingVertical: 15,
                paddingHorizontal: 16,
                backgroundColor: LilyColors.surfaceCard,
                borderWidth: 1,
                borderColor: 'rgba(63,191,127,0.18)',
                borderRadius: 22,
              }}
            >
              <Text style={{ fontFamily: LilyFonts.serif, fontSize: 16, color: '#D3EADF' }}>
                If things feel heavy
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 19,
                  fontFamily: LilyFonts.sans,
                  color: '#9FBCAE',
                  marginTop: 4,
                }}
              >
                Lily isn&apos;t a crisis service — reach a person any time.
              </Text>
              <TouchableOpacity
                onPress={() => go('/(support)')}
                style={{
                  marginTop: 10,
                  alignSelf: 'flex-start',
                  backgroundColor: LilyColors.accent,
                  borderRadius: 100,
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                }}
              >
                <Text
                  style={{ fontSize: 12.5, fontFamily: LilyFonts.sansMedium, color: LilyColors.ground }}
                >
                  Support resources
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textFaint,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              Everything here is yours.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
