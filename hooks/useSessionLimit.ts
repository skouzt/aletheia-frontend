import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

type UsageStatus = {
  remainingSeconds: number;
  allowed: boolean;
  sessions_used: number;
  sessions_limit: number;
  plan: string | null;
  reason: string | null;
} | null;

export function useSessionLimit() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<UsageStatus>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async (): Promise<UsageStatus> => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/usage/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data: UsageStatus = await res.json();
      setStatus(data);
      return data;
    } catch {
      return null; // fail open — let backend enforce
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const record = useCallback(async () => {
    try {
      const token = await getToken();
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/usage/record`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch {
      // silent fail — never crash a session over this
    }
  }, [getToken]);

  return { status, loading, check, record };
}