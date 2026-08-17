import {
  BASE_PRICING,
  CountryPricing,
  pricingForCountry,
} from '@/constants/pricing.generated';
import { BillingInterval, priceFor } from '@/constants/pricing';
import { useAuth } from '@clerk/clerk-expo';
import * as Localization from 'expo-localization';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface PricingView {
  /** ISO-3166 country the price belongs to, or 'ZZ' when unknown. */
  region: string;
  pricing: CountryPricing;
  /** Device region code that produced the fallback, for debugging/telemetry. */
  detectedRegionCode: string | null;
  monthlyLabel: string;
  yearlyLabel: string;
  /** Percentage saved by paying yearly. */
  yearlySaving: number;
  /** True once the server has confirmed the price. */
  confirmed: boolean;
  /** Copy for the fine print under the CTA. */
  footerFor: (interval: BillingInterval) => string;
  labelFor: (interval: BillingInterval) => string;
}

interface ServerPricing {
  country: string;
  currency: string;
  monthly: { amount: number; display: string };
  yearly: { amount: number; display: string };
  yearly_saving_percent: number;
  trial_days: number;
}

/** Best guess from the device, used until the server answers. */
function deviceCountry(): string | null {
  try {
    const locales = Localization.getLocales();
    for (const l of locales) {
      if (l.regionCode) return l.regionCode.toUpperCase();
    }
    // An Indian user whose phone language is "English (United States)" reports a
    // US region code, so currency and time zone are checked before giving up.
    for (const l of locales) {
      if (l.currencyCode === 'INR') return 'IN';
    }
    const tz = Localization.getCalendars()[0]?.timeZone?.toLowerCase();
    if (tz === 'asia/kolkata' || tz === 'asia/calcutta') return 'IN';
  } catch {
    return null;
  }
  return null;
}

function savingPercent(p: CountryPricing): number {
  const twelve = p.monthly * 12;
  if (twelve <= 0) return 0;
  return Math.max(0, Math.round((1 - p.yearly / twelve) * 100));
}

/**
 * Resolves which price to display.
 *
 * Two stages on purpose. The bundled catalogue renders immediately so the screen
 * never shows a spinner or a placeholder price, then the server confirms — it can
 * see the edge geo header, while the device only knows its own locale, which is a
 * setting rather than a location. For almost everyone the two agree and nothing
 * visibly changes; when they disagree the server wins, because that is the signal
 * Dodo's checkout keys off. Showing a price we cannot honour at checkout is the
 * one outcome worth avoiding.
 */
export function usePricing(): PricingView {
  const { getToken, isSignedIn } = useAuth();

  const detectedRegionCode = useMemo(deviceCountry, []);
  const [server, setServer] = useState<ServerPricing | null>(null);

  // getToken gets a new identity every render; in a dependency array that is an
  // infinite fetch loop. This app has hit that before.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    (async () => {
      try {
        const base = process.env.EXPO_PUBLIC_API_URL;
        if (!base) return;
        const token = await getTokenRef.current({ template: 'backend-api' });
        if (!token || cancelled) return;

        const qs = detectedRegionCode ? `?country=${detectedRegionCode}` : '';
        const res = await fetch(`${base}/api/v1/billing/pricing${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        setServer((await res.json()) as ServerPricing);
      } catch {
        // Keep the bundled price; a pricing screen that renders is better than
        // one that errors, and checkout re-resolves server-side anyway.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, detectedRegionCode]);

  return useMemo(() => {
    const fallback = detectedRegionCode
      ? pricingForCountry(detectedRegionCode)
      : BASE_PRICING;

    const pricing: CountryPricing = server
      ? {
          currency: server.currency,
          monthly: server.monthly.amount,
          yearly: server.yearly.amount,
          monthlyLabel: server.monthly.display,
          yearlyLabel: server.yearly.display,
        }
      : fallback;

    const monthlyLabel = pricing.monthlyLabel;
    const yearlyLabel = pricing.yearlyLabel;

    const labelFor = (interval: BillingInterval) =>
      interval === 'yearly' ? yearlyLabel : monthlyLabel;

    const footerFor = (interval: BillingInterval) =>
      interval === 'yearly'
        ? `Free for 3 days, then ${yearlyLabel} per year. No commitment — cancel anytime.`
        : `Free for 3 days, then ${monthlyLabel} per month. No commitment — cancel anytime.`;

    return {
      region: server?.country ?? detectedRegionCode ?? 'ZZ',
      pricing,
      detectedRegionCode,
      monthlyLabel,
      yearlyLabel,
      yearlySaving: server?.yearly_saving_percent ?? savingPercent(pricing),
      confirmed: server !== null,
      footerFor,
      labelFor,
    };
  }, [server, detectedRegionCode]);
}

export { priceFor };
export type { BillingInterval };
