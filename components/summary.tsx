import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const CHART_HEIGHT = 150;
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


function getEmotionInfo(intensity: any) {
  try {
    const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 7)));
    const map = INTENSITY_MAP[value - 1] || INTENSITY_MAP[6];
    let color = '#10B981';
    if (value >= 7) color = '#EF4444';
    else if (value >= 4) color = '#F59E0B';
    return { label: map.label, color };
  } catch {
    return { label: 'Neutral', color: '#10B981' };
  }
}

const StaticInsights = memo(() => (
  <View className="px-4 py-4" key="static-insights">
    <Text
      className="text-lg font-semibold text-text-light mb-3"
      style={{ fontFamily: 'LibreCaslonText-Bold' }}
    >
      Insights from Aletheia
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 8 }}
    >
      <View className="flex-row gap-4">
        <View className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-col" style={{ width: 256 }}>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#D8BFD8' }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                Patterns Noticed
              </Text>
              <Text className="text-sm text-gray-500">Coming soon</Text>
            </View>
          </View>
          <Text className="text-sm text-text-light mb-4">
            Aletheia will notice patterns in your sessions and help you understand recurring emotional themes.
          </Text>
          <TouchableOpacity
            disabled
            className="h-10 rounded-lg items-center justify-center mt-auto"
            style={{ backgroundColor: 'rgba(1,152,99,0.2)' }}
          >
            <Text className="text-sm font-bold" style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold' }}>
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-col" style={{ width: 256 }}>
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#FFDAB9' }}>
              <MaterialCommunityIcons name="key-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                Key Takeaways
              </Text>
              <Text className="text-sm text-gray-500">Coming soon</Text>
            </View>
          </View>
          <Text className="text-sm text-text-light mb-4">
            Important insights and breakthroughs from your sessions will be summarized here.
          </Text>
          <TouchableOpacity
            disabled
            className="h-10 rounded-lg items-center justify-center mt-auto"
            style={{ backgroundColor: 'rgba(1,152,99,0.2)' }}
          >
            <Text className="text-sm font-bold" style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold' }}>
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  </View>
));

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
  const router = useRouter();

  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const getTokenRef = useRef(getToken); // ✅ stable ref for getToken

  // ✅ keep ref in sync without adding getToken to effect deps
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const chartProgress = useSharedValue(0);

  useEffect(() => {
    if (journey.length > 1) {
      chartProgress.value = 0;
      chartProgress.value = withTiming(1, { duration: 900 });
    }
  }, [journey]);

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
      const waitSeconds = Math.ceil((MIN_REFRESH_INTERVAL_MS - (now - parseInt(lastRefresh))) / 1000);
      Alert.alert("Please wait", `You can refresh again in ${waitSeconds} seconds`);
      return false;
    }
    await AsyncStorage.setItem(LAST_REFRESH_KEY(userId), now.toString());
    return true;
  }, [userId]);

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY(userId));
      if (!cached) return false;
      const parsed: SessionsCache = JSON.parse(cached);
      if (!isMounted.current) return false;
      setSessions(parsed.sessions);
      setJourney(parsed.journey);
      setHasMore(parsed.hasMore);
      setHasSessions(parsed.sessions.length > 0);
      return true;
    } catch (error) {
      console.error('Cache read error:', error);
      return false;
    }
  }, [userId]);

  const saveToCache = useCallback(async (data: SessionsCache) => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(CACHE_KEY(userId), JSON.stringify(data));
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, [userId]);

  const fetchFromBackend = useCallback(async (pageNumber: number, isRefresh: boolean = false): Promise<boolean> => {
    if (!userId) return false;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const token = await getTokenRef.current({ template: "backend-api" }); // ✅ use ref

      const sessionsRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/therapy/sessions?page=${pageNumber}&page_size=${PAGE_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true", 
          },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!sessionsRes.ok) {
        if (sessionsRes.status === 429) {
          Alert.alert("Rate limit", "Too many requests. Please try again later.");
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
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true", // ✅
            },
            signal: abortControllerRef.current.signal,
          }
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
      } else {
        if (!isMounted.current) return false;
        setSessions(prev => [...prev, ...sessionsData.sessions]);
        setHasMore(sessionsData.has_more);
      }

      setPage(sessionsData.page);
      return true;

    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
        return false;
      }
      console.error("Failed to fetch:", error);
      return false;
    }
  }, [userId, saveToCache]); 

  const loadSessions = useCallback(async (pageNumber: number = 0, isRefresh: boolean = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (pageNumber === 0 && !isRefresh) {
      const hasCache = await loadFromCache();
      if (hasCache) {
        setLoading(false);
        fetchFromBackend(0, false);
        return;
      }
    }

    setLoading(true);
    const success = await fetchFromBackend(pageNumber, isRefresh);
    if (!success && pageNumber === 0) setHasSessions(false);
    setLoading(false);
  }, [userId, loadFromCache, fetchFromBackend]);

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
  }, [userId]); 

  const journeyPath = useMemo(() => {
    if (!journey || journey.length < 2) return '';
    const stepX = CHART_WIDTH / Math.max(1, journey.length - 1);
    return journey
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${intensityToY(p.intensity)}`)
      .join(' ');
  }, [journey]);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View className="sticky top-0 z-10 bg-background-light px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="w-12 items-start" />
          <Text
            className="flex-1 text-center text-xl font-bold text-text-light"
            style={{ fontFamily: 'LibreCaslonText-Bold' }}
          >
            Summaries & Insights
          </Text>
          <View className="w-12 items-end" />
        </View>
      </View>

      <ScrollView
        className="flex-1 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <StaticInsights />

        {journey.length >= 2 && (
          <View className="px-4 py-2 space-y-4 mb-4">
            <Text className="text-lg font-semibold text-text-light mb-3" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
              Your Emotional Journey
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <View className="min-h-[180px]">
                <Svg
                  width="100%"
                  height={CHART_HEIGHT}
                  viewBox={`-3 0 ${CHART_WIDTH + 6} ${CHART_HEIGHT}`}
                  preserveAspectRatio="none"
                >
                  <Defs>
                    <LinearGradient id="chartGradient" x1="236" y1="1" x2="236" y2={CHART_HEIGHT} gradientUnits="userSpaceOnUse">
                      <Stop offset="0" stopColor="#AEC6CF" stopOpacity="0.4" />
                      <Stop offset="1" stopColor="#AEC6CF" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Path d={`${journeyPath} V ${CHART_HEIGHT} H 0 Z`} fill="url(#chartGradient)" />
                  <AnimatedPath
                    d={journeyPath}
                    stroke="#AEC6CF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="1000"
                    animatedProps={animatedProps}
                  />
                </Svg>
              </View>
              <View className="flex-row justify-around mt-2">
                {journey.slice(-7).map((p, i) => (
                  <Text key={i} className="text-xs font-bold text-gray-500">
                    {safeFormatDate(p.date, 'EEE')}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {sessions.length > 0 && (
          <View className="px-4 py-2 space-y-4 mb-4">
            <Text className="text-lg font-semibold text-text-light mb-3" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
              Recent Sessions
            </Text>

            {sessions.map((session, i) => {
              if (!session) return null;
              try {
                const emotion = getEmotionInfo(session.session_intensity);
                const dateStr = session.created_at || session.date;
                const sessionDate = new Date(dateStr);

                if (isNaN(sessionDate.getTime())) {
                  return (
                    <View key={session.id} className="bg-red-100 p-4 m-4 rounded-xl">
                      <Text className="text-red-600">Invalid session date</Text>
                    </View>
                  );
                }

                return (
                  <View key={session.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View>
                        <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                          Session on {safeFormatDate(sessionDate, 'MMMM d, yyyy')}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {safeFormatDate(sessionDate, 'h:mm a')}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-base font-semibold text-text-light mb-2" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                      {session.title}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: `${emotion.color}22` }}>
                          <Text className="text-sm font-medium" style={{ color: emotion.color }}>
                            {emotion.label}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        className="flex-row items-center gap-2"
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
                          } catch (error) {
                            Alert.alert("Error", "Failed to open session details");
                          }
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          allowFontScaling={false}
                          style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold', fontSize: 10, minWidth: 50 }}
                        >
                          View Details
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#019863" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              } catch (error) {
                return (
                  <View key={`error-${i}`} className="bg-red-100 p-4 m-4 rounded-xl">
                    <Text className="text-red-600">Error rendering session</Text>
                  </View>
                );
              }
            })}

            {!!hasMore && ( // ✅ cast to boolean to fix TS2322
              <TouchableOpacity
                onPress={loadMore}
                disabled={loading}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm items-center justify-center mt-2"
              >
                <Text className="text-[#019863] font-semibold" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                  {loading ? 'Loading...' : 'Load More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {hasSessions === false && !loading && (
          <View className="px-6 pt-8 items-center">
            <Image
              source={require('@/assets/images/summary.png')}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
            <Text
              className="text-lg text-text-light mt-5 text-center"
              style={{ fontFamily: 'LibreCaslonText-Bold', letterSpacing: 0.1 }}
            >
              No sessions yet
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-2 px-2" style={{ lineHeight: 20 }}>
              Your summaries and insights will appear here once you've completed a session.
            </Text>
            <TouchableOpacity
              className="mt-5 px-6 py-2.5 rounded-xl items-center justify-center"
              style={{ backgroundColor: '#F3F4F6' }}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                Start a session
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && hasSessions === null && (
          <View className="px-6 pt-8 items-center">
            <Text className="text-gray-400">Loading...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}