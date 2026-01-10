import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

type Plan = "none" | "guided" | "extended";

interface SubscriptionState {
  plan: Plan;
  status: "active" | "expired" | "cancelled" | "none";
  expiresAt?: string;
  dailyMinutes: number;
  loading: boolean;
}

const PLAN_CONFIG = {
  guided: { dailyMinutes: 60, name: "Guided" },
  extended: { dailyMinutes: 480, name: "Extended" },
};

export function useSubscription() {
  const { getToken, isSignedIn } = useAuth();
  
  // Use refs for internal state that shouldn't trigger re-renders
  const isInitialCheckDoneRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: "none",
    status: "none",
    dailyMinutes: 0,
    loading: true,
  });

  /**
   * Fetch subscription with deduplication and rate limiting
   */
  const fetchSubscription = useCallback(async () => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      console.log("Fetch skipped: already in progress");
      return;
    }

    // Rate limiting: minimum 5 seconds between requests
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 5000 && isInitialCheckDoneRef.current) {
      console.log("Fetch skipped: too soon");
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    setSubscription(prev => ({ ...prev, loading: true }));

    try {
      // Must be signed in to fetch subscription
      if (!isSignedIn) {
        setSubscription({
          plan: "none",
          status: "none",
          dailyMinutes: 0,
          loading: false,
        });
        isInitialCheckDoneRef.current = true;
        return;
      }

      const token = await getToken({ template: "backend-api" });
      
      if (!token) {
        throw new Error("No authentication token available");
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      
      // ✅ FIX: Changed endpoint to match your backend
      const res = await fetch(`${apiUrl}/api/v1/billing/me/subscription`, { 
        headers,
        cache: 'no-store',
      });

      // Handle 401 Unauthorized (token expired or invalid)
      if (res.status === 401) {
        console.warn("Authentication failed: invalid token");
        setSubscription({
          plan: "none",
          status: "none",
          dailyMinutes: 0,
          loading: false,
        });
        isInitialCheckDoneRef.current = true;
        return;
      }

      // Handle other errors
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Subscription fetch failed: HTTP ${res.status}`, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      const hasSub = data.has_subscription ?? (data.plan && data.plan !== "none");
      const userPlan = hasSub ? (data.plan || "none") : "none";
      
      setSubscription({
        plan: userPlan,
        status: data.status || "none",
        expiresAt: data.expires_at,
        dailyMinutes: PLAN_CONFIG[userPlan as keyof typeof PLAN_CONFIG]?.dailyMinutes || 0,
        loading: false,
      });
    } catch (err) {
      console.error("Subscription fetch failed:", err);
      setSubscription(prev => ({ ...prev, loading: false }));
    } finally {
      isFetchingRef.current = false;
      isInitialCheckDoneRef.current = true;
    }
  }, [getToken, isSignedIn]);

  // ✅ ONLY runs once on mount - no polling
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]); // ✅ FIX: Include dependency

  return { 
    ...subscription, 
    refresh: fetchSubscription, // Manual refresh only
  };
}