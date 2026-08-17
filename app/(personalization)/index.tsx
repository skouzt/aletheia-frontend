/**
 * Personalization — how Lily sounds.
 *
 * Every control cycles on tap rather than opening a picker, so the whole screen is
 * one scroll with no modals. The tick in the nav bar commits to the server, which
 * is what actually reaches Lily's system prompt.
 *
 * Edits are mirrored to AsyncStorage as they happen even though the tick is the
 * real save: dismissing a modal by gesture is easy to do by accident, and losing a
 * paragraph someone wrote about themselves is not a recoverable mistake.
 */

import { LilyNavBar, LilyScreen, LilyScroll, LilyToggle } from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { publishPersonalization } from '@/hooks/usePersonalization';
import { fetchPersonalization, pushPersonalization } from '@/services/personalization';
import {
  DEFAULT_PERSONALIZATION,
  Personalization,
  TONES,
  TRAITS,
  TRAIT_LEVELS,
  cycle,
  loadCache,
  normalise,
  saveCache,
} from '@/state/personalization';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 9,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        fontFamily: LilyFonts.sansSemi,
        color: LilyColors.textFaint,
        paddingHorizontal: 4,
        paddingTop: 18,
        paddingBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

const cardStyle = {
  backgroundColor: LilyColors.surface,
  borderWidth: 1,
  borderColor: LilyColors.hairlineSoft,
  borderRadius: 20,
} as const;

function Caret() {
  return <Text style={{ fontSize: 10, color: LilyColors.textMuted, marginLeft: 2 }}>▾</Text>;
}

/** Nav-bar save button. Muted until there is something to save. */
function SaveTick({
  dirty,
  saving,
  onPress,
}: {
  dirty: boolean;
  saving: boolean;
  onPress: () => void;
}) {
  if (saving) {
    return (
      <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color={LilyColors.accent} />
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!dirty}
      hitSlop={12}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: dirty ? LilyColors.accent : LilyColors.ghostFill,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: LilyFonts.sansBold,
          color: dirty ? LilyColors.ground : LilyColors.textFaint,
        }}
      >
        ✓
      </Text>
    </TouchableOpacity>
  );
}

export default function PersonalizationScreen() {
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const [value, setValue] = useState<Personalization>(DEFAULT_PERSONALIZATION);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = useRef(false);

  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) return;
      const cached = await loadCache(userId);
      if (cancelled) return;

      // Local-first, like usePersonalization: this device's copy is authoritative
      // for reads, so opening the screen normally costs no request at all. Unsaved
      // edits outrank everything — reopening after an accidental dismissal must
      // not silently discard them.
      if (cached) {
        setValue(cached.value);
        setDirty(cached.dirty);
        ready.current = true;
        return;
      }

      // Nothing stored on this device — a reinstall or a second device. Fetch once
      // so the screen does not present defaults over real saved preferences.
      try {
        const server = normalise(await fetchPersonalization(getTokenRef.current));
        if (cancelled) return;
        setValue(server);
        void saveCache(userId, server, false);
      } catch {
        // Offline — defaults are editable, and the tick syncs them when it works.
      } finally {
        if (!cancelled) ready.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = useCallback(
    (next: Personalization) => {
      setValue(next);
      setError(null);
      if (!ready.current || !userId) return;
      setDirty(true);
      void saveCache(userId, next, true);
    },
    [userId],
  );

  const onSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // The response is what was actually stored — the server drops values it
      // does not recognise, and the UI should reflect that rather than the guess.
      const saved = normalise(await pushPersonalization(getTokenRef.current, value));
      setValue(saved);
      if (userId) await saveCache(userId, saved, false);
      // Push into the shared store so Settings shows the new tone immediately,
      // instead of refetching this endpoint every time that screen regains focus.
      publishPersonalization(saved);
      setDirty(false);
      router.back();
    } catch {
      setError('Couldn’t save just now. Your changes are kept — try again.');
    } finally {
      setSaving(false);
    }
  }, [value, router, userId]);

  return (
    <LilyScreen>
      <LilyNavBar
        title="Personalization"
        onBack={() => router.back()}
        right={<SaveTick dirty={dirty} saving={saving} onPress={onSave} />}
      />

      <LilyScroll contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 34 }}>
        {/* ── Base style and tone ─────────────────────────────────────────── */}
        <View style={{ ...cardStyle, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: LilyFonts.sansSemi, color: LilyColors.textPrimary }}>
              Base style and tone
            </Text>
            <Text
              style={{
                fontSize: 10.5,
                lineHeight: 16,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textMuted,
                marginTop: 4,
              }}
            >
              How Lily sounds by default. This doesn’t change what she can help with.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => update({ ...value, tone: cycle(TONES, value.tone) })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: LilyColors.surfaceRaised,
              borderWidth: 1,
              borderColor: LilyColors.hairline,
              borderRadius: 100,
              paddingVertical: 6,
              paddingHorizontal: 11,
            }}
          >
            <Text style={{ fontSize: 11.5, fontFamily: LilyFonts.sansSemi, color: LilyColors.textBody }}>
              {value.tone}
            </Text>
            <Caret />
          </TouchableOpacity>
        </View>

        {/* ── Characteristics ─────────────────────────────────────────────── */}
        <Caption>Characteristics</Caption>
        <View style={{ ...cardStyle, overflow: 'hidden' }}>
          {TRAITS.map((trait, i) => (
            <TouchableOpacity
              key={trait.key}
              onPress={() =>
                update({
                  ...value,
                  traits: {
                    ...value.traits,
                    [trait.key]: cycle(TRAIT_LEVELS, value.traits[trait.key]),
                  },
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: LilyColors.hairlineFaint,
              }}
            >
              <Text style={{ flex: 1, fontSize: 12.5, fontFamily: LilyFonts.sans, color: LilyColors.textPrimary }}>
                {trait.label}
              </Text>
              <Text style={{ fontSize: 11.5, fontFamily: LilyFonts.sansSemi, color: LilyColors.textMuted }}>
                {value.traits[trait.key]}
              </Text>
              <Caret />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Gentle check-ins ────────────────────────────────────────────── */}
        <View
          style={{
            ...cardStyle,
            marginTop: 14,
            padding: 15,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: LilyFonts.sansSemi, color: LilyColors.textPrimary }}>
              Gentle check-ins
            </Text>
            <Text
              style={{
                fontSize: 10.5,
                lineHeight: 16,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textMuted,
                marginTop: 4,
              }}
            >
              Lily may open a conversation on her own when it’s been a while.
            </Text>
          </View>
          <LilyToggle
            value={value.check_ins}
            onChange={(check_ins) => update({ ...value, check_ins })}
          />
        </View>

        {/* ── What Lily should know ───────────────────────────────────────── */}
        <Caption>What Lily should know</Caption>
        <TextInput
          value={value.note}
          onChangeText={(note) => update({ ...value, note })}
          placeholder="Anything that helps Lily understand you — how you like to be supported, what you’re working through…"
          placeholderTextColor={LilyColors.textFaint}
          multiline
          maxLength={2000}
          textAlignVertical="top"
          style={{
            ...cardStyle,
            borderRadius: 18,
            minHeight: 88,
            paddingVertical: 13,
            paddingHorizontal: 14,
            fontFamily: LilyFonts.sans,
            fontSize: 12.5,
            lineHeight: 20,
            color: LilyColors.textPrimary,
          }}
        />

        {error ? (
          <Text
            style={{
              textAlign: 'center',
              fontSize: 11.5,
              lineHeight: 17,
              fontFamily: LilyFonts.sans,
              color: LilyColors.danger,
              paddingHorizontal: 12,
              paddingTop: 12,
            }}
          >
            {error}
          </Text>
        ) : null}

        <Text
          style={{
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 16,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textFaint,
            paddingHorizontal: 12,
            paddingTop: 14,
          }}
        >
          Saved to your account and used only to shape how Lily talks with you.
        </Text>
      </LilyScroll>
    </LilyScreen>
  );
}
