type Plan = "none" | "guided" | "extended";

export function useSubscription() {
  return {
    plan: "none" as Plan,
    status: "none" as const,
    dailyMinutes: Infinity,
    loading: false,
    refresh: async () => {},
  };
}
