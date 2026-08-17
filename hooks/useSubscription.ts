import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

/** Lily sells unlimited conversations, billed monthly or yearly. No metering. */
export type Plan = "none" | "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "expired"
  | "cancelled"
  | "past_due"
  | "none";

interface SubscriptionState {
  plan: Plan;
  status: SubscriptionStatus;
  expiresAt?: string;
  nextBillingDate?: string;
  trialEnd?: string;
  isTrialing: boolean;
  /** What they're actually billed — resolved server-side, not from device locale. */
  region?: string;
  currency?: string;
  amount?: number;
  period?: string;
  canStartSession: boolean;
  loading: boolean;
}

const EMPTY: SubscriptionState = {
  plan: "none",
  status: "none",
  isTrialing: false,
  canStartSession: false,
  loading: false,
};

const PLANS: Plan[] = ["monthly", "yearly"];
const STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "expired",
  "cancelled",
  "past_due",
];

/** Statuses that grant access. Mirrors GRANTING_STATUSES in subscription_service.py. */
const GRANTING: SubscriptionStatus[] = ["active", "trialing", "cancelled"];

interface SubscriptionPayload {
  status?: string;
  plan?: string;
  expires_at?: string;
  next_billing_date?: string;
  trial_end?: string;
  is_trialing?: boolean;
  region?: string;
  currency?: string;
  amount?: number;
  period?: string;
}

/**
 * Whether the user may talk to Lily right now.
 *
 * This used to come from a second request to /usage/check. That endpoint stopped
 * metering anything when the plans went unlimited — it just re-answers the
 * subscription question — so it doubled the request count to compute one boolean.
 * /billing/me/subscription already returns the status and both expiry dates, so
 * the same answer is derivable here.
 *
 * Kept faithful to services/subscription_service.get_subscription_state, including
 * the expiry check: a row can still say "active" past its expires_at.
 */
function deriveCanStartSession(
  status: SubscriptionStatus,
  payload: SubscriptionPayload,
): boolean {
  if (!GRANTING.includes(status)) return false;

  const isTrialing = status === "trialing";
  const raw = isTrialing ? payload.trial_end : payload.expires_at;
  const expiry = raw ? Date.parse(raw) : NaN;

  if (!Number.isNaN(expiry)) return expiry >= Date.now();

  // Cancelled with no known end date — nothing left to honour, so treat it as over.
  return status !== "cancelled";
}

/* ── Shared store ────────────────────────────────────────────────────────────
 *
 * The throttle used to live in per-instance refs, which meant it never fired
 * across components: five call sites mounting together produced five independent
 * fetches. Hoisting the state to the module makes concurrent mounts share one
 * request and one result.
 */

type Listener = (state: SubscriptionState) => void;

const TTL_MS = 5000;

let cache: SubscriptionState = { ...EMPTY, loading: true };
let cachedUserId: string | null = null;
let listeners = new Set<Listener>();
let inFlight: Promise<void> | null = null;
let lastFetchedAt = 0;

function emit() {
  for (const listener of listeners) listener(cache);
}

function setCache(next: SubscriptionState) {
  cache = next;
  emit();
}

/** Drop everything when the signed-in user changes, so account B never reads A's plan. */
function resetFor(userId: string | null) {
  cachedUserId = userId;
  lastFetchedAt = 0;
  inFlight = null;
  cache = { ...EMPTY, loading: Boolean(userId) };
}

async function loadSubscription(
  getToken: (opts: { template: string }) => Promise<string | null>,
  isSignedIn: boolean,
  force: boolean,
): Promise<void> {
  // The actual dedupe: concurrent callers await the same request.
  if (inFlight) return inFlight;
  if (!force && lastFetchedAt && Date.now() - lastFetchedAt < TTL_MS) return;

  lastFetchedAt = Date.now();

  inFlight = (async () => {
    try {
      if (!isSignedIn) {
        setCache({ ...EMPTY });
        return;
      }

      const token = await getToken({ template: "backend-api" });
      if (!token) {
        setCache({ ...EMPTY });
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/api/v1/billing/me/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
      });

      if (res.status === 401) {
        setCache({ ...EMPTY });
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const sub: SubscriptionPayload = await res.json();

      const plan = PLANS.includes(sub.plan as Plan) ? (sub.plan as Plan) : "none";
      const status = STATUSES.includes(sub.status as SubscriptionStatus)
        ? (sub.status as SubscriptionStatus)
        : "none";

      setCache({
        plan,
        status,
        expiresAt: sub.expires_at,
        nextBillingDate: sub.next_billing_date,
        trialEnd: sub.trial_end,
        isTrialing: sub.is_trialing ?? status === "trialing",
        region: sub.region,
        currency: sub.currency,
        amount: sub.amount,
        period: sub.period,
        canStartSession: deriveCanStartSession(status, sub),
        loading: false,
      });
    } catch (err) {
      console.error("Subscription fetch failed:", err);
      // A failed refresh must not blank out a plan we already know about.
      setCache({ ...cache, loading: false });
      // Let the next caller retry rather than sitting behind the TTL.
      lastFetchedAt = 0;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function useSubscription() {
  const { getToken, isSignedIn, userId } = useAuth();

  // getToken has a new identity every render; capturing it in a ref keeps it out
  // of dependency arrays, where it would re-trigger the effect on every render.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [state, setState] = useState<SubscriptionState>(cache);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const refresh = useCallback(
    () => loadSubscription(getTokenRef.current, Boolean(isSignedIn), true),
    [isSignedIn],
  );

  useEffect(() => {
    const uid = userId ?? null;
    if (cachedUserId !== uid) {
      resetFor(uid);
      setState(cache);
    }
    void loadSubscription(getTokenRef.current, Boolean(isSignedIn), false);
  }, [isSignedIn, userId]);

  return { ...state, refresh };
}
