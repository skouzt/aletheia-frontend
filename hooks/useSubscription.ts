import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

type Plan = "none" | "clarity" | "insight";

interface SubscriptionState {
  plan: Plan;
  status: "active" | "expired" | "cancelled" | "past_due" | "none";
  expiresAt?: string;
  nextBillingDate?: string;
  sessionsPerMonth: number;
  minutesPerSession: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  canStartSession: boolean;
  loading: boolean;
}

// ✅ Single source of truth (frontend)
const PLAN_CONFIG: Record<
  Exclude<Plan, "none">,
  { sessions: number; minutes: number }
> = {
  clarity: { sessions: 10, minutes: 40 },
  insight: { sessions: 15, minutes: 40 },
};

export function useSubscription() {
  const { getToken, isSignedIn } = useAuth();

  const isInitialCheckDoneRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: "none",
    status: "none",
    sessionsPerMonth: 0,
    minutesPerSession: 0,
    sessionsUsed: 0,
    sessionsRemaining: 0,
    canStartSession: false,
    loading: true,
  });

  const fetchSubscription = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;

    const now = Date.now();
    if (
      !force &&
      now - lastFetchTimeRef.current < 5000 &&
      isInitialCheckDoneRef.current
    ) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    setSubscription((prev) => ({ ...prev, loading: true }));

    try {
      // ❌ Not signed in
      if (!isSignedIn) {
        setSubscription({
          plan: "none",
          status: "none",
          sessionsPerMonth: 0,
          minutesPerSession: 0,
          sessionsUsed: 0,
          sessionsRemaining: 0,
          canStartSession: false,
          loading: false,
        });
        isInitialCheckDoneRef.current = true;
        return;
      }

      const token = await getToken({ template: "backend-api" });
      if (!token) throw new Error("No authentication token available");

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // ✅ Parallel fetch
      const [subRes, usageRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/billing/me/subscription`, {
          headers,
          cache: "no-store",
        }),
        fetch(`${baseUrl}/api/v1/usage/check`, {
          headers,
          cache: "no-store",
        }),
      ]);

      // ❌ Unauthorized
      if (subRes.status === 401) {
        setSubscription({
          plan: "none",
          status: "none",
          sessionsPerMonth: 0,
          minutesPerSession: 0,
          sessionsUsed: 0,
          sessionsRemaining: 0,
          canStartSession: false,
          loading: false,
        });
        isInitialCheckDoneRef.current = true;
        return;
      }

      if (!subRes.ok) {
        throw new Error(`HTTP ${subRes.status}: ${await subRes.text()}`);
      }

      const sub: {
        status?: string;
        plan?: string;
        expires_at?: string;
        next_billing_date?: string;
      } = await subRes.json();

      // ✅ Safe plan parsing
      const safePlan: Plan =
        sub.plan === "clarity" || sub.plan === "insight"
          ? sub.plan
          : "none";

      const planConfig =
        safePlan !== "none" ? PLAN_CONFIG[safePlan] : null;

      const sessionsPerMonth = planConfig?.sessions ?? 0;
      const minutesPerSession = planConfig?.minutes ?? 0;

      // ✅ Usage fetch (safe)
      let sessionsUsed = 0;
      let canStartSession = false;

      if (usageRes.ok) {
        const usage: {
          allowed?: boolean;
          sessions_used?: number;
        } = await usageRes.json();

        sessionsUsed = usage.sessions_used ?? 0;
        canStartSession = usage.allowed ?? false;
      }

      const safeStatus: SubscriptionState["status"] =
        sub.status === "active" ||
        sub.status === "expired" ||
        sub.status === "cancelled" ||
        sub.status === "past_due"
          ? sub.status
          : "none";

      const isActive = safeStatus === "active";

      setSubscription({
        plan: safePlan,
        status: safeStatus,
        expiresAt: sub.expires_at,
        nextBillingDate: sub.next_billing_date,
        sessionsPerMonth,
        minutesPerSession,
        sessionsUsed,
        sessionsRemaining: Math.max(0, sessionsPerMonth - sessionsUsed),
        canStartSession: isActive && canStartSession,
        loading: false,
      });
    } catch (err) {
      console.error("Subscription fetch failed:", err);
      setSubscription((prev) => ({ ...prev, loading: false }));
    } finally {
      isFetchingRef.current = false;
      isInitialCheckDoneRef.current = true;
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    ...subscription,
    refresh: () => fetchSubscription(true),
  };
}