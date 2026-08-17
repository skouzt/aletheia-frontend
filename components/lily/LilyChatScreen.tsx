import { LilyColors, LilyFonts, LilyGradients } from '@/constants/lily';
import {
  ChatError,
  ChatMessage,
  OPENING_THREAD,
  closeSession,
  fetchHistory,
  formatTime,
  sendMessage,
} from '@/services/lilyChat';
import { useDictation } from '@/hooks/useDictation';
import { markSummariesStale } from '@/state/summariesFreshness';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  TouchableOpacity,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { LilyMenu, LilyMenuButton } from './LilyMenu';

const BODY_SIZE = 14;
const BODY_LINE = 21.7; // 14 × 1.55, per the design doc
const META_SIZE = 9.5;

/* ── Icons ─────────────────────────────────────────────────────────────────── */

function ImageIcon() {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: '-12deg' }] }}
    >
      <Rect
        x={3}
        y={4.5}
        width={18}
        height={15}
        rx={3.5}
        stroke={LilyColors.iconMuted}
        strokeWidth={1.7}
      />
      <Circle cx={8.6} cy={10} r={1.6} stroke={LilyColors.iconMuted} strokeWidth={1.7} />
      <Path
        d="M3.6 16.6l4.6-4.2a2 2 0 0 1 2.7 0l3.5 3.2m0 0l2-1.8a2 2 0 0 1 2.7 0l1.4 1.3"
        stroke={LilyColors.iconMuted}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicIcon({ active = false }: { active?: boolean }) {
  const stroke = active ? '#04170D' : LilyColors.textNeutral;
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2.5} width={6} height={12} rx={3} stroke={stroke} strokeWidth={1.7} />
      <Path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function NewChatIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 11.7c0 4.5-3.9 8.1-8.7 8.1a9.6 9.6 0 0 1-3-.5L4 20.6l1.5-3.6a7.8 7.8 0 0 1-1.7-4.8C3.8 7.7 7.7 4 12.5 4"
        stroke={LilyColors.icon}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.5 3.5v6M20.5 6.5h-6"
        stroke={LilyColors.icon}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </Svg>
  );
}

/* Starter-prompt icons for the empty thread. */

function MindIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11.4c0 4.2-3.6 7.6-8 7.6a9 9 0 0 1-2.8-.4L4.5 20l1.4-3.4A7.3 7.3 0 0 1 4 11.4C4 7.2 7.6 4 12 4s8 3.2 8 7.4z"
        stroke={LilyColors.iconMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TangleIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15.5c3.5 3 7-3.5 10.5-1 2.4 1.7 1 5-1.4 4.4-2.6-.6-2.2-4.6.4-6.4 3-2.1 6.6-.6 8.5 1.5"
        stroke={LilyColors.iconMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.6 9.6c3-2.6 6.2 2.4 9.4.6"
        stroke={LilyColors.iconMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
    </Svg>
  );
}

function VentIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12c1.6-4 3.2-4 4.8 0s3.2 4 4.8 0 3.2-4 4.8 0 3.2 4 4.6 0"
        stroke={LilyColors.iconMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const STARTERS = [
  { key: 'mind', Icon: MindIcon, label: 'Something’s on my mind' },
  { key: 'tangle', Icon: TangleIcon, label: 'Help me untangle a feeling' },
  { key: 'vent', Icon: VentIcon, label: 'I just need to vent' },
] as const;

function CloseIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={LilyColors.textPrimary}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SendIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="#04170D"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ── Message bubbles ───────────────────────────────────────────────────────── */

function LilyBubble({ message }: { message: ChatMessage }) {
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={{ alignItems: 'flex-start' }}>
      <View style={{ maxWidth: '80%' }}>
        <View
          style={{
            backgroundColor: LilyColors.surface,
            borderWidth: 1,
            borderColor: LilyColors.hairline,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            borderBottomLeftRadius: 6,
            paddingVertical: 11,
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={{
              fontSize: BODY_SIZE,
              lineHeight: BODY_LINE,
              letterSpacing: 0.05,
              fontFamily: LilyFonts.sans,
              color: LilyColors.textPrimary,
            }}
          >
            {message.text}
          </Text>
        </View>
        <Text
          style={{
            fontSize: META_SIZE,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textFaint,
            paddingTop: 5,
            paddingLeft: 10,
          }}
        >
          {message.time}
        </Text>
      </View>
    </Animated.View>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <Animated.View entering={FadeInDown.duration(450)} style={{ alignItems: 'flex-end' }}>
      <View style={{ maxWidth: '80%' }}>
        <View
          style={{
            backgroundColor: LilyColors.userBubble,
            borderWidth: 1,
            borderColor: LilyColors.hairlineSoft,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomRightRadius: 6,
            borderBottomLeftRadius: 20,
            overflow: 'hidden',
          }}
        >
          {!!message.imageUri && (
            <Image
              source={{ uri: message.imageUri }}
              contentFit="cover"
              style={{ width: 180, height: 180, backgroundColor: LilyColors.surface }}
            />
          )}
          {!!message.text && (
            <Text
              style={{
                fontSize: BODY_SIZE,
                lineHeight: BODY_LINE,
                fontFamily: LilyFonts.sans,
                color: LilyColors.textStrong,
                paddingVertical: 11,
                paddingHorizontal: 14,
              }}
            >
              {message.text}
            </Text>
          )}
        </View>
        <Text
          style={{
            fontSize: META_SIZE,
            fontFamily: LilyFonts.sans,
            color: LilyColors.textFaint,
            textAlign: 'right',
            paddingTop: 5,
            paddingRight: 10,
          }}
        >
          {message.time}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ── Typing indicator ──────────────────────────────────────────────────────── */

function TypingDot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 390, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 390, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 520 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.55,
    transform: [{ translateY: -3 * progress.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: LilyColors.accent },
        style,
      ]}
    />
  );
}

function TypingBubble() {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: LilyColors.surface,
          borderWidth: 1,
          borderColor: LilyColors.hairline,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomRightRadius: 20,
          borderBottomLeftRadius: 6,
          paddingVertical: 12,
          paddingHorizontal: 15,
        }}
      >
        <TypingDot delay={0} />
        <TypingDot delay={180} />
        <TypingDot delay={360} />
      </View>
    </View>
  );
}

/* ── Screen ────────────────────────────────────────────────────────────────── */

export default function LilyChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(OPENING_THREAD);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /** Collapsed = the resting single-line pill; it grows once there is anything in it. */
  const expanded = focused || !!draft || !!attachment;
  /** Drives the mic → send swap in the composer. */
  const canSend = !!draft.trim() || !!attachment;
  /** A fresh thread shows starter prompts instead of the date header. */
  const isEmpty = messages.length === 0;

  const barWidth = useSharedValue(76);

  useEffect(() => {
    barWidth.value = withTiming(expanded ? 100 : 76, {
      duration: 280,
      easing: Easing.bezier(0.22, 0.9, 0.3, 1),
    });
  }, [expanded, barWidth]);

  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value}%` }));

  // Lifts the whole column by the keyboard's height, falling back to the home-indicator
  // inset when it is closed.
  const keyboard = useAnimatedKeyboard();
  const bottomInset = Math.max(insets.bottom, 6);
  const contentStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(keyboard.height.value, bottomInset),
  }));

  // Android's back button hides the keyboard without blurring the input, so `focused`
  // would stay true and the bar would stay expanded. Collapse it by hand on dismiss —
  // a non-empty draft still holds it open, via `expanded`.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      inputRef.current?.blur();
      setFocused(false);
    });
    return () => sub.remove();
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  useEffect(scrollToEnd, [messages, typing, scrollToEnd]);

  // Clerk hands back a NEW getToken identity on every render, so it must never sit
  // in a dependency array — doing so re-fires this effect on each re-render, and a
  // failure that triggers a re-render becomes an infinite fetch loop.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Dictation writes into the draft for review — it never sends on its own. A
  // misheard sentence posted to Lily unread would be worse than no dictation.
  const draftBeforeDictation = useRef('');
  const dictation = useDictation(
    useCallback((text: string) => {
      const prefix = draftBeforeDictation.current;
      setDraft(prefix ? `${prefix} ${text}` : text);
    }, []),
    useCallback((opts: { template: string }) => getTokenRef.current(opts), []),
  );


  const loadHistory = useCallback(async () => {
    try {
      const page = await fetchHistory(getTokenRef.current, { limit: 50 });
      if (page.messages.length) setMessages(page.messages);
      setHistoryError(null);
      return true;
    } catch (e) {
      // Surface the problem instead of redirecting: a redirect here re-mounts the
      // screen, which retries, which redirects again.
      setHistoryError(
        e instanceof ChatError && e.code === 'auth'
          ? 'Couldn’t verify your session.'
          : "Couldn't load your conversation.",
      );
      return false;
    }
  }, []);

  // Pull the existing conversation on mount. An empty history keeps the static
  // greeting, which is client-side only — sending is what starts a session.
  //
  // Clerk tokens are short-lived, so the very first load can land with a stale one.
  // A single delayed retry covers that without a redirect loop.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await loadHistory();
      if (ok || cancelled) return;
      await new Promise((r) => setTimeout(r, 1500));
      if (!cancelled) await loadHistory();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadHistory]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photos access needed',
        'Allow photo access in Settings to share an image with Lily.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAttachment(result.assets[0].uri);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    const imageUri = attachment ?? undefined;
    if ((!text && !imageUri) || typing) return;

    const outgoing: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      imageUri,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, outgoing]);
    setDraft('');
    setAttachment(null);
    setTyping(true);

    try {
      const { userMessage, reply } = await sendMessage(getTokenRef.current, text);
      // Swap the optimistic bubble for the persisted one so ids/timestamps are real.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== outgoing.id),
        userMessage,
        reply,
      ]);
      // Sending proves the token is good, so a banner from a failed mount-time load
      // is now stale. Backfill the thread we couldn't fetch earlier.
      if (historyError) {
        setHistoryError(null);
        loadHistory();
      }
    } catch (e) {
      if (e instanceof ChatError && e.code === 'no_subscription') {
        setMessages((prev) => prev.filter((m) => m.id !== outgoing.id));
        setDraft(text);
        router.push('/paywall');
        return;
      }
      if (e instanceof ChatError && e.code === 'auth') {
        setHistoryError('Couldn’t verify your session.');
        setMessages((prev) => prev.filter((m) => m.id !== outgoing.id));
        setDraft(text);
        return;
      }
      // Mark the user's own message as failed rather than inventing a reply from
      // Lily — a fabricated apology in her voice is worse than a visible failure.
      setMessages((prev) =>
        prev.map((m) => (m.id === outgoing.id ? { ...m, failed: true } : m)),
      );
    } finally {
      setTyping(false);
    }
  }, [attachment, draft, typing, router, historyError, loadHistory]);

  /** Clears the thread to the starter prompts rather than replaying Lily's opener. */
  // Ends the conversation server-side so its summary is written now rather than
  // after the idle timer. Clearing only local state used to look like it worked until
  // a reload pulled the old thread straight back.
  const handleNewConversation = useCallback(async () => {
    setMessages(OPENING_THREAD);
    setDraft('');
    setTyping(false);
    setHistoryError(null);
    try {
      await closeSession(getTokenRef.current);
      // The reaper summarises this conversation shortly after; Summaries must not
      // keep serving a cache that predates it.
      markSummariesStale(userId);
    } catch {
      // The idle timer closes it anyway; nothing to undo on screen.
    }
  }, [userId]);

  const headerTop = Math.max(insets.top, 16) + 6;

  return (
    <View style={{ flex: 1, backgroundColor: LilyColors.ground }}>
      {/* The keyboard offset is applied by hand. Under Android edge-to-edge the window
          does not resize, so `KeyboardAvoidingView` either buried the composer (no
          behavior) or failed to unwind its padding on dismiss (behavior="padding").
          `useAnimatedKeyboard` follows the real inset animation in both directions. */}
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        {/* Header — the menu button floats over the left slot, so the title block
            is centred between two equal 34pt reservations. */}
        <View
          style={{
            paddingTop: headerTop,
            paddingHorizontal: 16,
            paddingBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 34,
          }}
        >
          <View style={{ width: 34 }} />

          <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text
              style={{
                fontFamily: LilyFonts.serif,
                fontSize: 17,
                lineHeight: 19,
                letterSpacing: 0.2,
                color: LilyColors.textPrimary,
              }}
            >
              Lily
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View
                style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: LilyColors.accent }}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textNeutralMuted,
                  letterSpacing: 0.1,
                }}
              >
                Here with you
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleNewConversation}
            hitSlop={8}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: LilyColors.surfaceButtonRaised,
              borderWidth: 1,
              borderColor: LilyColors.hairlineFaint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NewChatIcon />
          </TouchableOpacity>
        </View>

        {/* Thread */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 2,
            paddingHorizontal: 16,
            paddingBottom: 10,
            gap: 10,
          }}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', gap: 4, paddingTop: 6, paddingBottom: 10 }}>
            <Text
              style={{
                fontSize: 9.5,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                fontFamily: LilyFonts.sans,
                color: LilyColors.textFaint,
              }}
            >
              Today
            </Text>
            <Text style={{ fontSize: 9.5, fontFamily: LilyFonts.sans, color: LilyColors.textFaint }}>
              Private · only you and Lily
            </Text>
          </View>

          {messages.map((m) =>
            m.role === 'lily' ? (
              <LilyBubble key={m.id} message={m} />
            ) : (
              <UserBubble key={m.id} message={m} />
            ),
          )}

          {typing && <TypingBubble />}

          {!!historyError && (
            <View
              style={{
                alignSelf: 'center',
                marginTop: 12,
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 100,
                backgroundColor: LilyColors.surface,
                borderWidth: 1,
                borderColor: LilyColors.hairline,
              }}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textMuted,
                  textAlign: 'center',
                }}
              >
                {historyError}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Starters — shown only on a fresh thread, they fill the draft rather than
            sending, so the first message is still the user's own words. */}
        {isEmpty && (
          <Animated.View
            entering={FadeIn.duration(220)}
            style={{ paddingHorizontal: 22, paddingBottom: 14 }}
          >
            {STARTERS.map(({ key, Icon, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setDraft(label)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  paddingVertical: 11,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                }}
              >
                <View style={{ width: 22, alignItems: 'center' }}>
                  <Icon />
                </View>
                <Text
                  style={{
                    fontSize: 13.5,
                    letterSpacing: 0.1,
                    fontFamily: LilyFonts.sans,
                    color: LilyColors.textNeutralSoft,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Composer */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingBottom: 6,
            alignItems: 'center',
          }}
        >
          {/* The bar rests at 76% width and grows to full on focus — the design's way
              of keeping the idle composer quiet. */}
          <Animated.View
            style={[
              {
                borderRadius: 26,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: LilyColors.hairlineDim,
                backgroundColor: LilyColors.surfaceComposer,
              },
              barStyle,
            ]}
          >
              {!!attachment && (
                <Animated.View
                  entering={FadeIn.duration(160)}
                  style={{ paddingTop: 10, paddingLeft: 12 }}
                >
                  <View style={{ width: 62, height: 62 }}>
                    <Image
                      source={{ uri: attachment }}
                      contentFit="cover"
                      style={{
                        width: 62,
                        height: 62,
                        borderRadius: 14,
                        backgroundColor: LilyColors.surface,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => setAttachment(null)}
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: LilyColors.ground,
                        borderWidth: 1,
                        borderColor: LilyColors.hairlineBright,
                      }}
                    >
                      <CloseIcon />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 4,
                  paddingVertical: 6,
                  paddingRight: 6,
                  paddingLeft: 10,
                }}
              >
                <TouchableOpacity
                  onPress={handlePickImage}
                  hitSlop={6}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon />
                </TouchableOpacity>

                <TextInput
                  ref={inputRef}
                  value={draft}
                  onChangeText={setDraft}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onSubmitEditing={handleSend}
                  placeholder={expanded ? 'Tell Lily what’s on your mind' : 'Message Lily'}
                  placeholderTextColor={LilyColors.textMuted}
                  returnKeyType="send"
                  multiline
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 30,
                    maxHeight: expanded ? 118 : 30,
                    fontSize: 14,
                    lineHeight: 18,
                    fontFamily: LilyFonts.sans,
                    color: LilyColors.textPrimary,
                    paddingTop: 6,
                    paddingBottom: 6,
                  }}
                />

                {/* One button, two jobs: dictation while the box is empty, send once
                    there is something to send — the way ChatGPT's composer swaps. */}
                {canSend ? (
                  <TouchableOpacity onPress={handleSend} hitSlop={6}>
                    {/* borderRadius lives on the gradient itself — putting it on the
                        TouchableOpacity with overflow:hidden + elevation squares off on Android. */}
                    <LinearGradient
                      colors={LilyGradients.send}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 0.9, y: 1 }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SendIcon />
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    hitSlop={6}
                    onPress={() => {
                      if (!dictation.listening) draftBeforeDictation.current = draft.trim();
                      dictation.toggle();
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor:
                        dictation.state === 'listening'
                          ? LilyColors.accent
                          : dictation.state === 'transcribing'
                            ? LilyColors.accentWash
                            : LilyColors.surfaceMic,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MicIcon active={dictation.state === 'listening'} />
                  </TouchableOpacity>
                )}
              </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Rendered last so it paints above the scroll view on Android, where
          zIndex alone is not enough without elevation. */}
      <LilyMenuButton onPress={() => setMenuOpen(true)} top={headerTop + 2} />

      <LilyMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab="chat"
        onNewConversation={handleNewConversation}
      />
    </View>
  );
}
