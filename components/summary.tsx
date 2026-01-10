import { supabase } from '@/utils/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
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

/* -------------------- CONSTANTS -------------------- */
const CHART_HEIGHT = 150;
const CHART_WIDTH = 472;
const PAGE_SIZE = 5;

const AnimatedPath = createAnimatedComponent(Path);

const INTENSITY_MAP = [
  { emoji: '😵‍💫', label: 'Too much' },      // 1
  { emoji: '😰', label: 'Anxious' },         // 2
  { emoji: '😥', label: 'Overwhelmed' },     // 3
  { emoji: '😣', label: 'Strained' },        // 4
  { emoji: '😟', label: 'Heavy' },           // 5
  { emoji: '😕', label: 'Uneasy' },          // 6
  { emoji: '😐', label: 'Neutral' },         // 7
  { emoji: '😊', label: 'Light' },           // 8
  { emoji: '🙂', label: 'Okay' },            // 9
  { emoji: '😌', label: 'At ease' },         // 10
];
/* -------------------- TYPES -------------------- */
type SessionRow = {
  date: string;
  title: string;
  summary: string;
  session_intensity: number;
};

type JourneyPoint = {
  date: string;
  intensity: number;
};

/* -------------------- STATIC INSIGHTS -------------------- */
const StaticInsights = memo(() => (
  <View className="px-4 py-4">
    <Text
      className="text-lg font-semibold text-text-light mb-3"
      style={{ fontFamily: 'LibreCaslonText-Bold' }}
    >
      Insights from Aletheia
    </Text>

    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-4">
        {/* Pattern Insight Card */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm" style={{ width: 256 }}>
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#D4E6E1' }}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#019863" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                Patterns Noticed
              </Text>
              <Text className="text-sm text-gray-500">Coming soon</Text>
            </View>
          </View>

          <Text className="text-sm text-text-light mb-4">
            Aletheia will notice patterns in your sessions and provide insights to help you understand yourself better.
          </Text>

          <TouchableOpacity 
            disabled
            className="h-10 px-4 rounded-lg items-center justify-center opacity-50" 
            style={{ backgroundColor: 'rgba(1, 152, 99, 0.2)' }}
          >
            <Text className="text-sm font-bold" style={{ color: '#019863', fontFamily: 'LibreCaslonText-Bold' }}>
              Coming Soon
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Takeaways Card */}
        <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm" style={{ width: 256 }}>
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#C8B6E2' }}>
              <MaterialCommunityIcons name="key-outline" size={20} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                Key Takeaways
              </Text>
              <Text className="text-sm text-gray-500">Coming soon</Text>
            </View>
          </View>

          <Text className="text-sm text-text-light mb-4">
            Important insights and breakthroughs from your therapy sessions will be highlighted here.
          </Text>

          <TouchableOpacity 
            disabled
            className="h-10 px-4 rounded-lg items-center justify-center opacity-50" 
            style={{ backgroundColor: 'rgba(1, 152, 99, 0.2)' }}
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

/* -------------------- MAIN SCREEN -------------------- */
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
    if (!userId) return;

    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('therapy_sessions')
      .select('date, title, summary, session_intensity')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      if (pageNumber === 0) setHasSessions(false);
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
      .select('date, session_intensity')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (!error && data && data.length > 0) {
      setJourney(
        data.map(d => ({
          date: d.date,
          intensity: Number(d.session_intensity) || 1,
        }))
      );
    }
  }

  useEffect(() => {
    loadSessions();
    loadJourney();
  }, []);

  /* -------------------- CHART PATH -------------------- */
  function intensityToY(intensity: number) {
    return CHART_HEIGHT - (intensity / 10) * CHART_HEIGHT;
  }

  const journeyPath = useMemo(() => {
    if (journey.length < 2) return '';

    const stepX = CHART_WIDTH / (journey.length - 1);

    return journey
      .map((p, i) => {
        const x = i * stepX;
        const y = intensityToY(p.intensity);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [journey]);

  /* -------------------- HELPER: Get emotion info -------------------- */
  function getEmotionInfo(intensity: number) {
    // Clamp and normalize intensity to 1-10
    const value = Math.min(10, Math.max(1, Math.round(Number(intensity) || 1)));
    
    // Get precise mapping
    const map = INTENSITY_MAP[value - 1];
    
    // Determine color based on intensity ranges
    let color = '#10B981'; // 1-3: Calm (green)
    if (value >= 7) color = '#EF4444'; // 7-10: Intense (red)
    else if (value >= 4) color = '#F59E0B'; // 4-6: Unsettled (amber)
    
    return {
      emoji: map.emoji,
      label: map.label,
      color,
    };
  }

  /* -------------------- UI -------------------- */
  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-4 pb-2 border-b border-gray-200">
        <Text
          className="text-xl font-bold text-text-light text-center"
          style={{ fontFamily: 'LibreCaslonText-Bold' }}
        >
          Summaries & Insights
        </Text>
      </View>

      <ScrollView className="flex-1 pb-24" showsVerticalScrollIndicator={false}>
        
        {/* Insights from Aletheia */}
        <StaticInsights />

        {/* Emotional Journey Chart */}
        {journey.length > 0 && (
          <View className="px-4 py-6">
            <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <Text
                className="text-lg font-semibold text-text-light mb-4"
                style={{ fontFamily: 'LibreCaslonText-Bold' }}
              >
                Your Emotional Journey
              </Text>

              <View className="h-44 mb-4">
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

              <View className="flex-row justify-around">
                {journey.slice(-7).map((point, idx) => (
                  <Text key={idx} className="text-xs font-bold text-gray-500">
                    {format(new Date(point.date), 'EEE')}
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
              const emotion = getEmotionInfo(Number(session.session_intensity));
              const sessionDate = new Date(session.date);

              return (
                <View
                  key={`${session.date}-${i}`}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-base font-semibold text-text-light" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                        Session on {format(sessionDate, 'MMMM d, yyyy')}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {format(sessionDate, 'h:mm a')}
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <MaterialCommunityIcons name="dots-vertical" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-base font-semibold text-text-light mb-2"
                    style={{ fontFamily: 'LibreCaslonText-Bold' }}
                  >
                    {session.title}
                  </Text>

                  <Text className="text-sm text-gray-500">
                    {format(sessionDate, 'MMMM d, yyyy')}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      {/* Single emoji + label */}
                      <Text style={{ fontSize: 26 }}>{emotion.emoji}</Text>
                      
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${emotion.color}22` }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{ color: emotion.color }}
                        >
                          {emotion.label}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={{ flexShrink: 0 }}
                      className="flex-row items-center gap-2"
                      onPress={() =>
                        router.push({
                          pathname: '/(expandleview)',
                          params: {
                            date: session.date,
                            summary: session.summary,
                            intensity: session.session_intensity,
                          },
                        })
                      }
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
            })}

            {hasMore && (
              <TouchableOpacity
                onPress={() => loadSessions(page + 1)}
                className="py-4 items-center"
              >
                <Text className="text-[#019863] font-semibold">
                  Load more sessions
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty State */}
        {hasSessions === false && !loading && (
          <View className="px-4 py-10 mb-8">
            <View className="bg-white rounded-xl p-8 border border-dashed border-gray-300 items-center">
              <MaterialCommunityIcons name="file-document-outline" size={48} color="#9CA3AF" />
              <Text
                className="text-lg font-semibold text-text-light mt-4 text-center"
                style={{ fontFamily: 'LibreCaslonText-Bold' }}
              >
                No Sessions Yet
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-2 mb-6">
                Your first session summary and insights from Aletheia will appear here once you've completed a session.
              </Text>
              <TouchableOpacity
                  onPress={() => router.replace('/(tabs)/home')}
                  accessibilityRole="button"
                  accessibilityLabel="Start your first session"
                  className="w-full h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: '#019863' }}
                >
                <Text className="text-base font-bold text-white" style={{ fontFamily: 'LibreCaslonText-Bold' }}>
                  Start Your First Session
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}