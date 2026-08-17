import {
  ArrowRight,
  LilyPageTitle,
  LilyScreen,
  LilyScroll,
  LilySectionTitle,
} from '@/components/lily/ui';
import { LilyColors, LilyFonts } from '@/constants/lily';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSummariesFresh, shouldRevalidate } from '@/state/summariesFreshness';
import { format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, TouchableOpacity, RefreshControl, ScrollView, Text, View } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const CHART_HEIGHT = 104;
const CHART_WIDTH = 472;
const PAGE_SIZE = 10;

const CACHE_KEY = (userId: string) => `sessions_cache_${userId}`;
const LAST_REFRESH_KEY = (userId: string) => `last_refresh_${userId}`;
const MIN_REFRESH_INTERVAL_MS = 30000;

const AnimatedPath = createAnimatedComponent(Path);

const INTENSITY_MAP = [
  { label: 'Too much' },
  { label: 'Anxious' },
  { label: 'Overwhelmed' },
  { label: 'Strained' },
  { label: 'Heavy' },
  { label: 'Uneasy' },
  { label: 'Neutral' },
  { label: 'Light' },
  { label: 'Okay' },
  { label: 'At ease' },
];

type SessionRow = {
  id: string;
  created_at: string;
  date: string;
  title: string;
  summary: string;
  session_intensity: number;
};

type JourneyPoint = {
  date: string;
  intensity: number;
};

interface SessionsCache {
  sessions: SessionRow[];
  journey: JourneyPoint[];
  hasMore: boolean;
  fetchedAt: number;
}

function intensityToY(intensity: number) {
  return CHART_HEIGHT - (intensity / 10) * CHART_HEIGHT;
}

function safeFormatDate(dateInput: any, formatStr: string): string {
  try {
    if (!dateInput || dateInput === 'Invalid Date') return 'Date unavailable';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, formatStr);
  } catch {
    return 'Format error';
  }
}

function encodeForUrl(text: string): string {
  if (!text) return '';
  return encodeURIComponent(text.replace(/\n/g, ' '));
}

/**
 * Mood chips stay inside the mint family on purpose — the design brief calls for a
 * journal, not a dashboard, so a hard day is never coloured like an alarm.
 */
function getEmotionInfo(intensity: any) {
  try {
    const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 7)));
    const label = (INTENSITY_MAP[value - 1] || INTENSITY_MAP[6]).label;

    if (value >= 8) return { label, color: LilyColors.accentBright, tint: 'rgba(110,242,176,0.12)' };
    if (value >= 4) return { label, color: LilyColors.textSoft, tint: 'rgba(255,255,255,0.07)' };
    return { label, color: LilyColors.accent, tint: 'rgba(63,191,127,0.14)' };
  } catch {
    return { label: 'Neutral', color: LilyColors.textSoft, tint: 'rgba(255,255,255,0.07)' };
  }
}

const INSIGHT_CARDS = [
  {
    icon: '💡',
    tint: 'rgba(63,191,127,0.16)',
    title: 'Patterns Noticed',
    status: 'Coming soon',
    body: 'Lily will notice patterns in your sessions and help you understand recurring emotional themes.',
  },
  {
    icon: '🗝️',
    tint: 'rgba(110,242,176,0.14)',
    title: 'Key Takeaways',
    status: 'Coming soon',
    body: 'Important insights and reflections from your sessions will be gathered here for you.',
  },
];

const StaticInsights = memo(() => (
  <View key="static-insights">
    <LilySectionTitle style={{ paddingTop: 8, paddingHorizontal: 18, paddingBottom: 9 } as never}>
      Insights from Lily
    </LilySectionTitle>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 4 }}
    >
      {INSIGHT_CARDS.map((card) => (
        <View
          key={card.title}
          style={{
            width: 210,
            backgroundColor: LilyColors.surfaceRaisedAlt,
            borderWidth: 1,
            borderColor: LilyColors.hairlineFaint,
            borderRadius: 18,
            paddingHorizontal: 13,
            paddingTop: 13,
            paddingBottom: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: card.tint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13 }}>{card.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: LilyFonts.sansSemi,
                  color: LilyColors.textPrimary,
                }}
              >
                {card.title}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textFaint,
                  marginTop: 1,
                }}
              >
                {card.status}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 17.8,
              fontFamily: LilyFonts.sans,
              color: LilyColors.textSoft,
              marginTop: 10,
            }}
          >
            {card.body}
          </Text>

          <View
            style={{
              marginTop: 11,
              backgroundColor: 'rgba(63,191,127,0.10)',
              borderRadius: 11,
              padding: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ fontSize: 11.5, fontFamily: LilyFonts.sansSemi, color: LilyColors.accentBright }}
            >
              Coming Soon
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
));
StaticInsights.displayName = 'StaticInsights';

function SummarySkeleton() {
  const blockStyle = {
    borderRadius: 24,
    backgroundColor: LilyColors.surface,
    borderWidth: 1,
    borderColor: LilyColors.hairline,
  } as const;

  return (
    <View style={{ paddingHorizontal: 22, paddingTop: 8, gap: 16 }}>
      <View style={[blockStyle, { height: 26, width: 190, borderRadius: 12 }]} />
      <View style={[blockStyle, { height: 190 }]} />
      <View style={[blockStyle, { height: 210 }]} />
      <View style={[blockStyle, { height: 140 }]} />
      <View style={[blockStyle, { height: 140 }]} />
    </View>
  );
}

export async function addSessionToCache(userId: string, newSession: SessionRow) {
  try {
    const cacheKey = CACHE_KEY(userId);
    const cached = await AsyncStorage.getItem(cacheKey);

    const updatedSessions = cached
      ? [newSession, ...JSON.parse(cached).sessions].slice(0, 10)
      : [newSession];

    const updatedJourney = updatedSessions
      .slice()
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((s: SessionRow) => ({ date: s.created_at, intensity: s.session_intensity }));

    const updatedCache: SessionsCache = {
      sessions: updatedSessions,
      journey: updatedJourney,
      hasMore: updatedSessions.length >= 10,
      fetchedAt: Date.now(),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedCache));
  } catch (error) {
    console.error('Failed to update cache:', error);
  }
}

export default function SessionSummariesScreen() {
  const { userId, getToken } = useAuth();
  const [journey, setJourney] = useState<JourneyPoint[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasSessions, setHasSessions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      setIsReady(false);
      timerRef.current = setTimeout(() => {
        setIsReady(true);
        timerRef.current = null;
      }, 320);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []),
  );

  const chartProgress = useSharedValue(0);

  useEffect(() => {
    if (journey.length > 1) {
      chartProgress.value = 0;
      chartProgress.value = withTiming(1, { duration: 900 });
    }
  }, [journey, chartProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - chartProgress.value) * 1000,
  }));

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const checkRefreshRateLimit = useCallback(async (): Promise<boolean> => {
    if (!userId) return true;
    const lastRefresh = await AsyncStorage.getItem(LAST_REFRESH_KEY(userId));
    const now = Date.now();
    if (lastRefresh && now - parseInt(lastRefresh) < MIN_REFRESH_INTERVAL_MS) {
      const waitSeconds = Math.ceil(
        (MIN_REFRESH_INTERVAL_MS - (now - parseInt(lastRefresh))) / 1000,
      );
      Alert.alert('Please wait', `You can refresh again in ${waitSeconds} seconds`);
      return false;
    }
    await AsyncStorage.setItem(LAST_REFRESH_KEY(userId), now.toString());
    return true;
  }, [userId]);

  const loadFromCache = useCallback(async (): Promise<SessionsCache | null> => {
    if (!userId) return null;
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY(userId));
      if (!cached) return null;
      const parsed: SessionsCache = JSON.parse(cached);
      if (!isMounted.current) return null;
      setSessions(parsed.sessions);
      setJourney(parsed.journey);
      setHasMore(parsed.hasMore);
      setHasSessions(parsed.sessions.length > 0);
      return parsed;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }, [userId]);

  const saveToCache = useCallback(
    async (data: SessionsCache) => {
      if (!userId) return;
      try {
        await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(data));
      } catch (error) {
        console.error('Cache save error:', error);
      }
    },
    [userId],
  );

  const fetchFromBackend = useCallback(
    async (pageNumber: number, isRefresh: boolean = false): Promise<boolean> => {
      if (!userId) return false;

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        const token = await getTokenRef.current({ template: 'backend-api' });

        const sessionsRes = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/therapy/sessions?page=${pageNumber}&page_size=${PAGE_SIZE}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            signal: abortControllerRef.current.signal,
          },
        );

        if (!sessionsRes.ok) {
          if (sessionsRes.status === 429) {
            Alert.alert('Rate limit', 'Too many requests. Please try again later.');
          }
          throw new Error(`HTTP ${sessionsRes.status}`);
        }

        const sessionsData = await sessionsRes.json();

        if (!sessionsData.sessions || sessionsData.sessions.length === 0) {
          if (pageNumber === 0) {
            if (!isMounted.current) return false;
            setSessions([]);
            setHasSessions(false);
            setJourney([]);
          }
          setHasMore(false);
          return false;
        }

        if (pageNumber === 0) {
          const journeyRes = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/therapy/journey`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
              },
              signal: abortControllerRef.current.signal,
            },
          );

          let journeyData: JourneyPoint[] = [];
          if (journeyRes.ok) {
            const journeyJson = await journeyRes.json();
            journeyData = journeyJson.journey || [];
          }

          if (!isMounted.current) return false;

          setSessions(sessionsData.sessions);
          setJourney(journeyData);
          setHasMore(sessionsData.has_more);
          setHasSessions(true);

          await saveToCache({
            sessions: sessionsData.sessions.slice(0, 10),
            journey: journeyData,
            hasMore: sessionsData.has_more,
            fetchedAt: Date.now(),
          });
          // Only cleared on a real success, so a failed revalidate leaves the
          // cache marked stale and the next visit retries.
          markSummariesFresh(userId);
        } else {
          if (!isMounted.current) return false;
          setSessions((prev) => [...prev, ...sessionsData.sessions]);
          setHasMore(sessionsData.has_more);
        }

        setPage(sessionsData.page);
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return false;
        }
        console.error('Failed to fetch:', error);
        return false;
      }
    },
    [userId, saveToCache],
  );

  const loadSessions = useCallback(
    async (pageNumber: number = 0, isRefresh: boolean = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      if (pageNumber === 0 && !isRefresh) {
        const cached = await loadFromCache();
        if (cached) {
          setLoading(false);
          // Revalidate only when something could actually have changed. This used
          // to fire on every visit, so the cache saved a spinner but never a
          // request — which is what put therapy/sessions and therapy/journey in
          // the log on every navigation.
          if (shouldRevalidate(userId, cached.fetchedAt)) {
            void fetchFromBackend(0, false);
          }
          return;
        }
      }

      setLoading(true);
      const success = await fetchFromBackend(pageNumber, isRefresh);
      if (!success && pageNumber === 0) setHasSessions(false);
      setLoading(false);
    },
    [userId, loadFromCache, fetchFromBackend],
  );

  const onRefresh = useCallback(async () => {
    const canRefresh = await checkRefreshRateLimit();
    if (!canRefresh) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    await fetchFromBackend(0, true);
    setRefreshing(false);
  }, [checkRefreshRateLimit, fetchFromBackend]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchFromBackend(page + 1, false);
  }, [hasMore, loading, page, fetchFromBackend]);

  useEffect(() => {
    if (userId) {
      loadSessions(0);
    } else {
      setLoading(false);
      setHasSessions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const journeyPath = useMemo(() => {
    if (!journey || journey.length < 2) return '';
    const stepX = CHART_WIDTH / Math.max(1, journey.length - 1);
    return journey
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${intensityToY(p.intensity)}`)
      .join(' ');
  }, [journey]);

  return (
    <LilyScreen>
      <LilyPageTitle>Summaries &amp; Insights</LilyPageTitle>

      <LilyScroll
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 38 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LilyColors.accent}
            colors={[LilyColors.accent]}
            progressBackgroundColor={LilyColors.surface}
          />
        }
      >
        {isReady ? (
          <>
            <StaticInsights />

            {journey.length >= 2 && (
              <View>
                <LilySectionTitle
                  style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 9 } as never}
                >
                  Your Emotional Journey
                </LilySectionTitle>
                <View
                  style={{
                    marginHorizontal: 18,
                    backgroundColor: LilyColors.surfaceRaisedAlt,
                    borderWidth: 1,
                    borderColor: LilyColors.hairlineFaint,
                    borderRadius: 18,
                    paddingTop: 14,
                    paddingHorizontal: 13,
                    paddingBottom: 10,
                  }}
                >
                  <Svg
                    width="100%"
                    height={CHART_HEIGHT}
                    viewBox={`-3 0 ${CHART_WIDTH + 6} ${CHART_HEIGHT}`}
                    preserveAspectRatio="none"
                  >
                    <Defs>
                      <LinearGradient
                        id="lilyJourney"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2={CHART_HEIGHT}
                        gradientUnits="userSpaceOnUse"
                      >
                        <Stop offset="0" stopColor={LilyColors.accent} stopOpacity="0.22" />
                        <Stop offset="1" stopColor={LilyColors.accent} stopOpacity="0" />
                      </LinearGradient>
                    </Defs>
                    <Path d={`${journeyPath} V ${CHART_HEIGHT} H 0 Z`} fill="url(#lilyJourney)" />
                    <AnimatedPath
                      d={journeyPath}
                      stroke={LilyColors.accent}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="1000"
                      animatedProps={animatedProps}
                    />
                    {journey.length > 0 && (
                      <>
                        <Circle cx={0} cy={intensityToY(journey[0].intensity)} r={4} fill={LilyColors.accent} />
                        <Circle
                          cx={CHART_WIDTH}
                          cy={intensityToY(journey[journey.length - 1].intensity)}
                          r={4}
                          fill={LilyColors.accent}
                        />
                      </>
                    )}
                  </Svg>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 4,
                      paddingHorizontal: 4,
                    }}
                  >
                    {journey.slice(-7).map((p, i) => (
                      <Text
                        key={i}
                        style={{
                          fontSize: 10,
                          fontFamily: LilyFonts.sansSemi,
                          color: LilyColors.textFaint,
                        }}
                      >
                        {safeFormatDate(p.date, 'EEE')}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {sessions.length > 0 && (
              <View>
                <LilySectionTitle
                  style={{ paddingTop: 20, paddingHorizontal: 18, paddingBottom: 9 } as never}
                >
                  Recent Sessions
                </LilySectionTitle>

                <View style={{ gap: 9, paddingHorizontal: 18 }}>
                  {sessions.map((session, i) => {
                    if (!session) return null;
                    try {
                      const emotion = getEmotionInfo(session.session_intensity);
                      const dateStr = session.created_at || session.date;
                      const sessionDate = new Date(dateStr);

                      if (isNaN(sessionDate.getTime())) return null;

                      return (
                        <TouchableOpacity
                          key={session.id}
                          onPress={() => {
                            try {
                              router.push({
                                pathname: '/(expandleview)',
                                params: {
                                  date: session.created_at || session.date,
                                  summary: encodeForUrl(session.summary),
                                  intensity: String(session.session_intensity),
                                },
                              });
                            } catch {
                              Alert.alert('Error', 'Failed to open session details');
                            }
                          }}
                          style={{
                            backgroundColor: LilyColors.surfaceRaisedAlt,
                            borderWidth: 1,
                            borderColor: LilyColors.hairlineFaint,
                            borderRadius: 18,
                            paddingHorizontal: 14,
                            paddingTop: 13,
                            paddingBottom: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: LilyFonts.sansSemi,
                              color: LilyColors.textPrimary,
                            }}
                          >
                            Session on {safeFormatDate(sessionDate, 'MMMM d, yyyy')}
                          </Text>
                          <Text
                            style={{
                              fontSize: 10.5,
                              fontFamily: LilyFonts.sans,
                              color: LilyColors.textFaint,
                              marginTop: 2,
                            }}
                          >
                            {safeFormatDate(sessionDate, 'h:mm a')}
                          </Text>

                          <Text
                            style={{
                              fontSize: 12.5,
                              fontFamily: LilyFonts.sansSemi,
                              color: LilyColors.textStrong,
                              marginTop: 9,
                            }}
                          >
                            {session.title}
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 10,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: emotion.tint,
                                borderRadius: 100,
                                paddingVertical: 4,
                                paddingHorizontal: 9,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontFamily: LilyFonts.sansMedium,
                                  color: emotion.color,
                                }}
                              >
                                {emotion.label}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Text
                                style={{
                                  fontSize: 11.5,
                                  fontFamily: LilyFonts.sansSemi,
                                  color: LilyColors.accentBright,
                                }}
                              >
                                View Details
                              </Text>
                              <ArrowRight />
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    } catch {
                      return null;
                    }
                  })}

                  {!!hasMore && (
                    <TouchableOpacity
                      onPress={loadMore}
                      disabled={loading}
                      style={{
                        backgroundColor: LilyColors.surfaceRaisedAlt,
                        borderWidth: 1,
                        borderColor: LilyColors.hairlineFaint,
                        borderRadius: 18,
                        padding: 13,
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: LilyFonts.sansSemi,
                          fontSize: 14,
                          color: LilyColors.accent,
                        }}
                      >
                        {loading ? 'Loading…' : 'Load More'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {hasSessions === false && !loading && (
              <View style={{ paddingHorizontal: 34, paddingTop: 48, alignItems: 'center' }}>
                <Text style={{ fontSize: 34 }}>🌱</Text>
                <Text
                  style={{
                    fontFamily: LilyFonts.serif,
                    fontSize: 22,
                    color: LilyColors.textPrimary,
                    marginTop: 16,
                    textAlign: 'center',
                  }}
                >
                  Nothing to look back on yet
                </Text>
                <Text
                  style={{
                    fontSize: 13.5,
                    lineHeight: 22,
                    fontFamily: LilyFonts.sans,
                    color: LilyColors.textFaint,
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  Once you and Lily have talked, your reflections will gather here.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(chat)')}
                  style={{
                    marginTop: 22,
                    backgroundColor: LilyColors.accent,
                    borderRadius: 100,
                    paddingVertical: 13,
                    paddingHorizontal: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: LilyFonts.sansSemi,
                      color: LilyColors.ground,
                    }}
                  >
                    Talk to Lily
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {sessions.length > 0 && (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 10,
                  fontFamily: LilyFonts.sans,
                  color: LilyColors.textFaint,
                  paddingTop: 16,
                  paddingHorizontal: 22,
                }}
              >
                Summaries are written by Lily, kept only on your device.
              </Text>
            )}
          </>
        ) : (
          <SummarySkeleton />
        )}
      </LilyScroll>
    </LilyScreen>
  );
}
