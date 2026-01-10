import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { useSubscription } from './useSubscription';

const PLAN_LIMITS = {
  guided: 60,
  extended: 480,
  none: 0
};

interface UsageData {
  date: string;
  minutesUsed: number;
}

interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in minutes
  date: string;
}

export function useUsageTracking() {
  const { plan } = useSubscription();
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [canStartSession, setCanStartSession] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const sessionStartTime = useRef<number | null>(null);
  const currentSessionId = useRef<string | null>(null);

  useEffect(() => {
    loadTodayUsage();
    loadSessionHistory();
  }, []);

  useEffect(() => {
    const limit = PLAN_LIMITS[plan] || 0;
    setCanStartSession(minutesUsed < limit && limit > 0);
  }, [minutesUsed, plan]);

  const loadTodayUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem('usage_data');
      
      if (stored) {
        const data: UsageData = JSON.parse(stored);
        
        if (data.date === today) {
          setMinutesUsed(data.minutesUsed);
        } else {
          setMinutesUsed(0);
          await saveUsage(0);
        }
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('session_history');
      if (stored) {
        const history: SessionRecord[] = JSON.parse(stored);
        // Sort by most recent first and limit to last 10
        const sorted = history
          .sort((a, b) => b.endTime - a.endTime)
          .slice(0, 10);
        setSessionHistory(sorted);
      }
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  const saveUsage = async (minutes: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data: UsageData = {
        date: today,
        minutesUsed: minutes
      };
      await AsyncStorage.setItem('usage_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save usage:', error);
    }
  };

  const saveSessionHistory = async (sessions: SessionRecord[]) => {
    try {
      await AsyncStorage.setItem('session_history', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session history:', error);
    }
  };

  const startSession = () => {
    const now = Date.now();
    sessionStartTime.current = now;
    currentSessionId.current = `session_${now}`;
  };

  const endSession = async () => {
    if (!sessionStartTime.current || !currentSessionId.current) return 0;

    const endTime = Date.now();
    const duration = endTime - sessionStartTime.current;
    const minutes = Math.ceil(duration / 60000);

    // Update daily usage
    const newTotal = minutesUsed + minutes;
    setMinutesUsed(newTotal);
    await saveUsage(newTotal);

    // Save session record
    const sessionRecord: SessionRecord = {
      id: currentSessionId.current,
      startTime: sessionStartTime.current,
      endTime: endTime,
      duration: minutes,
      date: new Date(sessionStartTime.current).toISOString()
    };

    const updatedHistory = [sessionRecord, ...sessionHistory];
    setSessionHistory(updatedHistory);
    await saveSessionHistory(updatedHistory);

    sessionStartTime.current = null;
    currentSessionId.current = null;

    return minutes;
  };

  const getCurrentSessionDuration = () => {
    if (!sessionStartTime.current) return 0;
    const duration = Date.now() - sessionStartTime.current;
    return Math.floor(duration / 60000); // Convert to minutes
  };

  const getMinutesRemaining = () => {
    const limit = PLAN_LIMITS[plan] || 0;
    return Math.max(0, limit - minutesUsed);
  };

  const getDailyLimit = () => {
    return PLAN_LIMITS[plan] || 0;
  };

  const getPercentUsed = () => {
    const limit = getDailyLimit();
    if (limit === 0) return 0;
    return Math.min(100, Math.round((minutesUsed / limit) * 100));
  };

  return {
    minutesUsed,
    minutesRemaining: getMinutesRemaining(),
    dailyLimit: getDailyLimit(),
    percentUsed: getPercentUsed(),
    canStartSession,
    loading,
    startSession,
    endSession,
    getCurrentSessionDuration,
    sessionHistory,
    plan
  };
}