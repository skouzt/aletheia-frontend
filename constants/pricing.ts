/**
 * Pricing types and helpers.
 *
 * The prices themselves live in `pricing.generated.ts`, generated from the backend's
 * core/billing/catalog.py — the same table pushed to Dodo. Nothing here hardcodes an
 * amount, deliberately: the hand-maintained IN/INTL table this replaced was how the
 * app came to advertise USD while Dodo charged INR.
 *
 * Read prices through `usePricing()`, which prefers the server's answer and falls
 * back to the generated table.
 */

import type { CountryPricing } from './pricing.generated';

export type BillingInterval = 'monthly' | 'yearly';

export type { CountryPricing };

export function priceFor(pricing: CountryPricing, interval: BillingInterval): number {
  return interval === 'yearly' ? pricing.yearly : pricing.monthly;
}

/**
 * The key sent to the backend at checkout.
 *
 * There is one Dodo product per interval; Dodo localises the currency itself from the
 * customer's billing country. The backend re-derives the country from edge geo headers
 * and only falls back to the `region` we send, so that value is a hint, not a choice.
 */
export function checkoutPlanKey(interval: BillingInterval): BillingInterval {
  return interval;
}
