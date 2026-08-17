/**
 * Shared Lily surface primitives.
 *
 * Every screen in the app is built from these so the true-black ground, the single
 * mint accent, and the Instrument Serif / Plus Jakarta Sans pairing stay consistent.
 */

import { LilyColors, LilyFonts } from '@/constants/lily';
import React from 'react';
import { TouchableOpacity, ScrollView, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

/* ── Icons ─────────────────────────────────────────────────────────────────── */

export function Chevron({ color = LilyColors.accent }: { color?: string }) {
  return (
    <Svg width={7} height={12} viewBox="0 0 7 12" fill="none">
      <Path d="M1 1l5 5-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function BackArrow({ color = LilyColors.textPrimary }: { color?: string }) {
  return (
    <Svg width={15} height={12} viewBox="0 0 15 12" fill="none">
      <Path
        d="M14 6H2m0 0l4-4M2 6l4 4"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseX({ color = LilyColors.textPrimary }: { color?: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none">
      <Path d="M1 1l12 12M13 1L1 13" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowRight({ color = LilyColors.accent }: { color?: string }) {
  return (
    <Svg width={12} height={9} viewBox="0 0 15 10" fill="none">
      <Path
        d="M1 5h12m0 0l-4-4m4 4l-4 4"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ── Shell ─────────────────────────────────────────────────────────────────── */

export function LilyScreen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ flex: 1, backgroundColor: LilyColors.ground }, style]}>{children}</View>;
}

/** Centered serif page title, as used on Summaries and Settings. */
export function LilyPageTitle({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 20) + 14,
        // The floating menu button sits at the left edge; this keeps the title clear of it.
        paddingHorizontal: 54,
        paddingBottom: 6,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: LilyFonts.serif,
          fontSize: 23,
          lineHeight: 25.3,
          color: LilyColors.textPrimary,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/** Title row with a back affordance, for pushed detail screens. */
export function LilyNavBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 20) + 12,
        paddingHorizontal: 20,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={12}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: LilyColors.ghostFill,
          }}
        >
          <BackArrow />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 34 }} />
      )}
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: LilyFonts.serif,
          fontSize: 22,
          color: LilyColors.textPrimary,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 34, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/* ── Surfaces ──────────────────────────────────────────────────────────────── */

export function LilyCard({
  children,
  style,
  radius = 24,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: LilyColors.surface,
          borderWidth: 1,
          borderColor: LilyColors.hairline,
          borderRadius: radius,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function LilySectionTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Text
      style={[
        {
          fontSize: 13.5,
          fontFamily: LilyFonts.sansSemi,
          color: LilyColors.textPrimary,
        },
        style as never,
      ]}
    >
      {children}
    </Text>
  );
}

/* ── Rows ──────────────────────────────────────────────────────────────────── */

export function LilyRow({
  icon,
  label,
  sub,
  value,
  onPress,
  right,
  showChevron = true,
}: {
  icon?: string;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: LilyColors.surface,
        borderWidth: 1,
        borderColor: LilyColors.hairline,
        borderRadius: 18,
        padding: 16,
      }}
    >
      {!!icon && <Text style={{ width: 24, textAlign: 'center', fontSize: 15 }}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: LilyFonts.sans, color: LilyColors.textPrimary }}>
          {label}
        </Text>
        {!!sub && (
          <Text
            style={{
              fontSize: 12.5,
              fontFamily: LilyFonts.sans,
              color: LilyColors.textFaint,
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        )}
      </View>
      {!!value && (
        <Text style={{ fontSize: 13, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}>
          {value}
        </Text>
      )}
      {right}
      {showChevron && !right && <Chevron />}
    </TouchableOpacity>
  );
}

/** 46×27 pill switch, matching the design doc exactly. */
export function LilyToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{
        width: 46,
        height: 27,
        borderRadius: 100,
        backgroundColor: value ? LilyColors.accent : 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: value ? 'flex-end' : 'flex-start',
        paddingHorizontal: 3,
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderRadius: 10.5,
          backgroundColor: value ? LilyColors.ground : '#5A5A5A',
        }}
      />
    </TouchableOpacity>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────────── */

export function LilyPrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: disabled
            ? 'rgba(63,191,127,0.35)'
            : LilyColors.accent,
          borderRadius: 100,
          paddingVertical: 17,
          paddingHorizontal: 20,
          alignItems: 'center',
          transform: [{ scale: 1 }],
          shadowColor: LilyColors.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 26,
          elevation: 8,
        },
        style as never,
      ]}
    >
      <Text style={{ fontSize: 16, fontFamily: LilyFonts.sansSemi, color: LilyColors.ground }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function LilyGhostButton({
  label,
  onPress,
  tone = 'neutral',
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: 'neutral' | 'danger';
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: LilyColors.surface,
          borderWidth: 1,
          borderColor: LilyColors.hairline,
          borderRadius: 18,
          padding: 17,
          alignItems: 'center',
        },
        style as never,
      ]}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: LilyFonts.sansBold,
          color: tone === 'danger' ? LilyColors.danger : LilyColors.textPrimary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ── Misc ──────────────────────────────────────────────────────────────────── */

export function LilyFootnote({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        textAlign: 'center',
        fontSize: 11.5,
        lineHeight: 18,
        fontFamily: LilyFonts.sans,
        color: LilyColors.textFaint,
      }}
    >
      {children}
    </Text>
  );
}

export function LilyBody({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Text
      style={[
        {
          fontSize: 14,
          lineHeight: 22,
          fontFamily: LilyFonts.sans,
          color: LilyColors.textBody,
        },
        style as never,
      ]}
    >
      {children}
    </Text>
  );
}

export function LilyScroll({
  children,
  contentContainerStyle,
  ...rest
}: React.ComponentProps<typeof ScrollView>) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[{ paddingBottom: 46 }, contentContainerStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
