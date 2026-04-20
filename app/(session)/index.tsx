import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { DimensionValue } from "react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

type UsageResponse = {
  minutes_used: number;
  sessions_limit: number;
  plan?: string | null;
};

type SessionApiResponse = {
  id: string;
  created_at: string;
  duration_minutes: number;
};

type SessionUiItem = {
  id: string;
  label: string;
  time: string;
  duration: string;
  durationMinutes: number;
};

function formatSessionDate(
  createdAt?: string | null
): { label: string; time: string } {
  if (!createdAt) {
    return { label: "Unknown", time: "--:--" };
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return { label: "Unknown", time: "--:--" };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.floor(
    (todayStart.getTime() - targetStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  let label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (diffDays === 0) {
    label = "Today";
  } else if (diffDays === 1) {
    label = "Yesterday";
  }

  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return { label, time };
}

export default function SessionsUsageScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [sessions, setSessions] = useState<SessionUiItem[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    let isMounted = true;

    const fetchSessionData = async () => {
      setLoading(true);

      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        const token = await getToken({ template: "backend-api" });

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const [usageRes, sessionsRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/usage/check`, {
            method: "GET",
            headers,
          }),
          fetch(`${baseUrl}/api/v1/therapy/sessions/recent`, {
            method: "GET",
            headers,
          }),
        ]);

        const usageJson = (await usageRes.json()) as Partial<UsageResponse> | null;
        const sessionsJson = (await sessionsRes.json()) as
          | Array<Partial<SessionApiResponse>>
          | null;

        const safeUsage: UsageResponse = {
          minutes_used:
            typeof usageJson?.minutes_used === "number"
              ? usageJson.minutes_used
              : 0,
          sessions_limit:
            typeof usageJson?.sessions_limit === "number"
              ? usageJson.sessions_limit
              : 0,
          plan: typeof usageJson?.plan === "string" ? usageJson.plan : null,
        };

        const safeSessions = Array.isArray(sessionsJson) ? sessionsJson : [];
        const mappedSessions: SessionUiItem[] = safeSessions.map(
          (session, index) => {
            const createdAt =
              typeof session?.created_at === "string" ? session.created_at : "";
            const durationMinutes =
              typeof session?.duration_minutes === "number"
                ? session.duration_minutes
                : 0;
            const { label, time } = formatSessionDate(createdAt);

            return {
              id:
                typeof session?.id === "string" && session.id.trim().length > 0
                  ? session.id
                  : `session-${index}`,
              label,
              time,
              duration: `${durationMinutes} min`,
              durationMinutes,
            };
          }
        );

        if (!isMounted) return;
        setUsage(safeUsage);
        setSessions(mappedSessions);
      } catch (error) {
        console.error("Failed to fetch sessions usage data:", error);
        if (!isMounted) return;
        setUsage({ minutes_used: 0, sessions_limit: 0 });
        setSessions([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessionData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  const DAILY_LIMIT_MINUTES = 40;
  const TODAY_USED_MINUTES = sessions.reduce(
    (total, session) =>
      total + (session.label === "Today" ? session.durationMinutes : 0),
    0
  );
  const ACTIVE_SESSION_MINUTES = sessions?.[0]?.durationMinutes ?? 0;
  const currentPlan = usage?.plan?.toLowerCase();
  const isInsightPlan = currentPlan === "insight";
  const planName = isInsightPlan ? "Insight" : "Clarity";
  const planMeta = isInsightPlan ? "15 sessions, 40 mins" : "10 sessions, 40 min";
  const remainingMinutes = Math.max(0, DAILY_LIMIT_MINUTES - TODAY_USED_MINUTES);
  const progressPercent =
    DAILY_LIMIT_MINUTES > 0
      ? Math.min(100, Math.round((TODAY_USED_MINUTES / DAILY_LIMIT_MINUTES) * 100))
      : 0;
  const progressWidth: DimensionValue = `${progressPercent}%`;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => router.back(), 320);
  };

  return (
    <View className="flex-1 justify-end bg-black/45">
      {isVisible && (
        <Animated.View
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.ease))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.ease))}
          className="overflow-hidden rounded-t-[34px] bg-[#F3F4F6]"
          style={{ height: "92%" }}
        >
          <LinearGradient
            colors={["#F8FAF9", "#F3F4F6"]}
            className="absolute left-0 right-0 top-0 h-44"
          />

          <View className="items-center pb-1 pt-3">
            <View className="h-1.5 w-12 rounded-full bg-[#D1D5DB]" />
          </View>

          <View className="flex-row items-start justify-between px-6 pb-4 pt-2">
            <View>
              <Text className="text-[30px] font-bold text-[#111827]">
                Your Journey
              </Text>
              <Text className="mt-1 text-sm font-medium text-[#4B5563]">
                A reflection of your time and presence
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
          >
            <View className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-3 w-3 rounded-full bg-[#10B981]" />
                  <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-[#10B981]">
                   In the moment
                  </Text>
                </View>
                <Ionicons name="mic-outline" size={19} color="#6EE7B7" />
              </View>

              <Text className="text-2xl font-bold text-[#111827]">
              You’re sharing right now
              </Text>
              <Text className="mt-1 text-sm text-[#4B5563]">
                {ACTIVE_SESSION_MINUTES} minutes shared
              </Text>
            </View>

            <View className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-[#D1FAE5]">
                  <Ionicons name="timer-outline" size={19} color="#10B981" />
                </View>
                <Text className="text-base font-semibold text-[#111827]">
                Today’s Time
                </Text>
              </View>

              <View className="mb-2 flex-row items-end justify-between">
                <Text className="text-[30px] font-bold text-[#111827]">
                  {TODAY_USED_MINUTES}
                  <Text className="text-lg font-medium text-[#4B5563]">
                    {" "}
                    of {DAILY_LIMIT_MINUTES} mins
                  </Text>
                </Text>
                <Text className="mb-1 text-xs text-[#6B7280]">
                 A new day begins at midnight
                </Text>
              </View>

              <View className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                <View
                  className="h-2 rounded-full bg-[#10B981]"
                  style={{ width: progressWidth }}
                />
              </View>

              <Text className="mt-3 text-xs text-[#6B7280]">
                You still have {remainingMinutes} minutes to share today.
              </Text>
            </View>

            <View className="mt-5">
              <Text className="mb-3 px-1 text-lg font-bold text-[#111827]">
                Your Plan
              </Text>

              <View className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        isInsightPlan ? "bg-[#F5F3FF]" : "bg-[#EEF2FF]"
                      }`}
                    >
                      <Ionicons
                        name={isInsightPlan ? "sparkles-outline" : "leaf-outline"}
                        size={18}
                        color={isInsightPlan ? "#8B5CF6" : "#6366F1"}
                      />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-[#111827]">
                        {planName}
                      </Text>
                      <Text className="text-xs text-[#4B5563]">
                        {planMeta}
                      </Text>
                    </View>
                  </View>
                  <View className="rounded-full bg-[#D1FAE5] px-2.5 py-1">
                    <Text className="text-xs font-medium text-[#10B981]">
                      Current
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-5">
              <Text className="mb-3 px-1 text-lg font-bold text-[#111827]">
               Your Reflections
              </Text>

              <View className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
                {sessions.map((session, index) => (
                  <View
                    key={session.id}
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      index < sessions.length - 1
                        ? "border-b border-[#E5E7EB]"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#6B7280"
                        />
                      </View>
                      <View>
                        <Text className="text-sm font-semibold text-[#111827]">
                          {session.label}
                        </Text>
                        <Text className="text-xs text-[#6B7280]">
                          {session.time}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-[#4B5563]">
                        {session.duration}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
