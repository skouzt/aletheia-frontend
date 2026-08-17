import { CloseX } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { useAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { markSummariesStale } from '@/state/summariesFreshness';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, TouchableOpacity, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

function ShieldIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l7 3v5.2c0 4.3-2.9 8.1-7 9.3-4.1-1.2-7-5-7-9.3V6l7-3z"
        stroke={LilyColors.accent}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M8.8 12.1l2.2 2.2 4.2-4.4"
        stroke={LilyColors.accent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"
        stroke={LilyColors.accentBright}
        strokeWidth={1.6}
      />
      <Path
        d="M12 7.4V12l3 1.8"
        stroke={LilyColors.accentBright}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" stroke={LilyColors.textFaint} strokeWidth={1.6} />
      <Path
        d="M12 11v5M12 7.8v.4"
        stroke={LilyColors.textFaint}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function ManageDataScreen() {
  const router = useRouter();
  const { userId, getToken } = useAuth();

  const [visible, setVisible] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => router.back(), 320);
  };

  async function clearHistory() {
    if (!userId) return;

    setConfirmVisible(false);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken({ template: 'backend-api' });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/therapy/sessions/clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Summaries holds a cache of exactly what was just deleted.
      markSummariesStale(userId);

      Alert.alert('Session History Cleared', 'Your past session summaries have been removed.');

      handleClose();
    } catch (error) {
      console.error('Failed to clear history:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: LilyColors.scrim }}>
      {visible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          style={{
            height: '90%',
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
          <View style={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: LilyColors.accentWashSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <ShieldIcon />
                </View>
                <Text
                  style={{ fontFamily: LilyFonts.serif, fontSize: 30, color: LilyColors.textPrimary }}
                >
                  Manage Your Data
                </Text>
              </View>

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

            <Text
              style={{
                marginTop: 10,
                maxWidth: 300,
                fontSize: 13,
                lineHeight: 21,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textMuted,
              }}
            >
              You&apos;re in control of your session history.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}
          >
            <View
              style={{
                backgroundColor: LilyColors.surfaceCard,
                borderWidth: 1,
                borderColor: LilyColors.accentBorder,
                borderRadius: 22,
                padding: 18,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ClockIcon />
                <Text
                  style={{ fontFamily: LilyFonts.sansSemi, fontSize: 16, color: LilyColors.textPrimary }}
                >
                  Clear Session History
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 23,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textBody,
                  marginTop: 8,
                }}
              >
                This will remove your past session summaries from the app. Your account will remain
                active.
              </Text>

              <TouchableOpacity
                onPress={() => setConfirmVisible(true)}
                disabled={loading}
                style={{
                  height: 48,
                  borderRadius: 100,
                  marginTop: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.surfaceButton,
                  borderWidth: 1,
                  borderColor: LilyColors.hairlineBright,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={LilyColors.textBody} />
                ) : (
                  <Text
                    style={{ fontFamily: LilyFonts.sansSemi, fontSize: 15, color: LilyColors.textPrimary }}
                  >
                    Clear History
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, paddingHorizontal: 2 }}>
              <View style={{ paddingTop: 2 }}>
                <InfoIcon />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  lineHeight: 20,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textFaint,
                }}
              >
                You&apos;ll be asked to confirm before this action is completed. No data is removed
                immediately.
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* Confirmation */}
      <Modal transparent visible={confirmVisible} animationType="fade" statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: LilyColors.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 26,
          }}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: LilyColors.surfaceCard,
              borderWidth: 1,
              borderColor: LilyColors.hairlineBright,
              borderRadius: 24,
              padding: 22,
            }}
          >
            <Text
              style={{ fontFamily: LilyFonts.serif, fontSize: 21, color: LilyColors.textPrimary }}
            >
              Clear session history?
            </Text>

            <Text
              style={{
                fontSize: 13.5,
                lineHeight: 22,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textBody,
                marginTop: 8,
              }}
            >
              This permanently removes your past session summaries. It cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => setConfirmVisible(false)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.surfaceButton,
                  borderWidth: 1,
                  borderColor: LilyColors.hairlineBright,
                }}
              >
                <Text
                  style={{ fontFamily: LilyFonts.sansSemi, fontSize: 14, color: LilyColors.textBody }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearHistory}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: LilyColors.danger,
                }}
              >
                <Text
                  style={{ fontFamily: LilyFonts.sansSemi, fontSize: 14, color: LilyColors.ground }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
