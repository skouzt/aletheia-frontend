import { supabase } from '@/utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
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

const { width } = Dimensions.get('window');

const CHART_HEIGHT = 150;
const CHART_WIDTH = 472;
const PAGE_SIZE = 5;

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


function safeFormatDate(dateInput: any, formatStr: string): string {
  try {
    if (!dateInput || dateInput === 'Invalid Date') {
      return 'Date unavailable';
    }
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateInput);
      return 'Invalid date';
    }
    
    return format(date, formatStr);
  } catch (error) {
    console.error("Date format error:", error);
    return 'Format error';
  }
}

function encodeForUrl(text: string): string {
  if (!text) return '';
  return encodeURIComponent(text.replace(/\n/g, ' ').substring(0, 500));
}

function getEmotionInfo(intensity: any) {
  try {
    const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 7)));
    const map = INTENSITY_MAP[value - 1] || INTENSITY_MAP[6];
    
    let color = '#10B981'; 
    if (value >= 7) color = '#EF4444'; 
    else if (value >= 4) color = '#F59E0B'; 
    
    return {
      label: map.label,
      color,
    };
  } catch (error) {
    console.error("Intensity error:", error);
    return {
      label: 'Neutral',
      color: '#10B981',
    };
  }
}



const StaticInsights = memo(() => (
  <View className="px-4 py-4">
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
        
        <View
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-col"
          style={{ width: 256 }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#D8BFD8' }}
            >
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={20}
                color="#fff"
              />
            </View>

            <View>
              <Text
                className="text-base font-semibold text-text-light"
                style={{ fontFamily: 'LibreCaslonText-Bold' }}
              >
                Patterns Noticed
              </Text>
              <Text className="text-sm text-gray-500">
                Coming soon
              </Text>
            </View>
          </View>

          <Text className="text-sm text-text-light mb-4">
            Aletheia will notice patterns in your sessions and help you
            understand recurring emotional themes.
          </Text>

          <TouchableOpacity
            disabled
            className="h-10 rounded-lg items-center justify-center mt-auto"
            style={{ backgroundColor: 'rgba(1,152,99,0.2)' }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold' }}
            >
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>

        <View
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-col"
          style={{ width: 256 }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#FFDAB9' }}
            >
              <MaterialCommunityIcons
                name="key-outline"
                size={20}
                color="#fff"
              />
            </View>

            <View>
              <Text
                className="text-base font-semibold text-text-light"
                style={{ fontFamily: 'LibreCaslonText-Bold' }}
              >
                Key Takeaways
              </Text>
              <Text className="text-sm text-gray-500">
                Coming soon
              </Text>
            </View>
          </View>

          <Text className="text-sm text-text-light mb-4">
            Important insights and breakthroughs from your sessions
            will be summarized here.
          </Text>

          <TouchableOpacity
            disabled
            className="h-10 rounded-lg items-center justify-center mt-auto"
            style={{ backgroundColor: 'rgba(1,152,99,0.2)' }}
          >
            <Text
              className="text-sm font-bold"
              style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold' }}
            >
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  </View>
));


export default function SessionSummariesScreen() {
  const { userId } = useAuth();
  const [journey, setJourney] = useState<JourneyPoint[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasSessions, setHasSessions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* -------------------- CHART ANIMATION -------------------- */
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

  /* -------------------- DATA FETCH -------------------- */
  async function loadSessions(pageNumber = 0) {
    
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Build query
    let query = supabase
      .from('therapy_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Only add range for pagination (skip for first page)
    if (pageNumber > 0) {
      const from = pageNumber * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase error:", error);
      Alert.alert("Error", "Failed to load sessions");
      setLoading(false);
      return;
    }
    if (!data || data.length === 0) {
      if (pageNumber === 0) {
        setSessions([]);
        setHasSessions(false);
      }
      setHasMore(false);
      setLoading(false);
      return;
    }

    const normalized = data.map(d => ({
      ...d,
      session_intensity: Number(d.session_intensity) || 1,
    }));

    setHasSessions(true);
    setSessions(prev => pageNumber === 0 ? normalized : [...prev, ...normalized]);
    setHasMore(data.length === PAGE_SIZE);
    setPage(pageNumber);
    setLoading(false);
  }

  async function loadJourney() {
    if (!userId) return;

    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('session_intensity, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setJourney(
        data.map(d => ({
          date: d.created_at,
          intensity: Number(d.session_intensity) || 1,
        }))
      );
    }
  }

  useEffect(() => {    
    if (userId) {
      loadSessions(0);
      loadJourney();
    } else {
      setLoading(false);
      setHasSessions(false);
    }
  }, [userId]); // ✅ Add userId dependency

  /* -------------------- CHART PATH -------------------- */
  function intensityToY(intensity: number) {
    return CHART_HEIGHT - (intensity / 10) * CHART_HEIGHT;
  }

  const journeyPath = useMemo(() => {
    if (!journey || journey.length < 2) return '';

    const stepX = CHART_WIDTH / Math.max(1, journey.length - 1);

    return journey
      .map((p, i) => {
        const x = i * stepX;
        const y = intensityToY(p.intensity);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [journey]);

  /* -------------------- UI -------------------- */
  return (
  <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
    <StatusBar barStyle="dark-content" />

    {/* 🔽 HEADER GOES HERE */}
    <View className="sticky top-0 z-10 bg-background-light  px-4 pt-3 pb-2">
      <View className="flex-row items-center justify-between">
        <View className="w-12 items-start">
        </View>

        <Text
          className="flex-1 text-center text-xl font-bold text-text-light"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Summaries & Insights
        </Text>

        <View className="w-12 items-end">
        </View>
      </View>
    </View>

    <ScrollView className="flex-1 pb-24" showsVerticalScrollIndicator={false}>
      
      <StaticInsights />

      {journey.length >= 2 && (
        <View className="px-4 py-2 space-y-4 mb-4">
          <Text
            className="text-lg font-semibold text-text-light mb-3"
            style={{ fontFamily: 'LibreCaslonText-Bold' }}
          >
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

                <Path
                  d={`${journeyPath} V ${CHART_HEIGHT} H 0 Z`}
                  fill="url(#chartGradient)"
                />

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

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <View className="px-4 py-2 space-y-4 mb-4">
          <Text
            className="text-lg font-semibold text-text-light mb-3"
            style={{ fontFamily: 'LibreCaslonText-Bold' }}
          >
            Recent Sessions
          </Text>

          {sessions.map((session, i) => {
            if (!session) {
              return null;
            }

            try {
              const emotion = getEmotionInfo(session.session_intensity);
              const dateStr = session.created_at || session.date;
              const sessionDate = new Date(dateStr);
              
              if (isNaN(sessionDate.getTime())) {
                console.error("❌ Invalid date:", dateStr);
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
                          const params = {
                            date: session.created_at || session.date,
                            summary: encodeForUrl(session.summary),
                            intensity: String(session.session_intensity),
                          };
                                                    
                          router.push({
                            pathname: '/(expandleview)',
                            params,
                          });
                        } catch (error) {
                          console.error("❌ Navigation error:", error);
                          Alert.alert("Error", "Failed to open session details");
                        }
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        allowFontScaling={false}
                        style={{
                          color: '#019863',
                          fontFamily: 'LibreCaslonText-Bold',
                          fontSize: 10,
                          minWidth: 50,
                        }}
                      >
                        View Details
                      </Text>

                      <MaterialCommunityIcons name="arrow-right" size={16} color="#019863" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            } catch (error) {
              console.error("❌ Session card render error:", error, session);
              return (
                <View key={`error-${i}`} className="bg-red-100 p-4 m-4 rounded-xl">
                  <Text className="text-red-600">Error rendering session</Text>
                  <Text className="text-xs text-red-500 mt-1">{String(error)}</Text>
                </View>
              );
            }
          })}
        </View>
      )}

      {/* Empty State */}
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

          <Text
            className="text-sm text-gray-400 text-center mt-2 px-2"
            style={{ lineHeight: 20 }}
          >
            Your summaries and insights will appear here once you've completed a session.
          </Text>

          <TouchableOpacity
            className="mt-5 px-6 py-2.5 rounded-xl items-center justify-center"
            style={{ backgroundColor: '#F3F4F6' }}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'LibreCaslonText-Bold' }}
            >
              Start a session
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  </SafeAreaView>
);
}