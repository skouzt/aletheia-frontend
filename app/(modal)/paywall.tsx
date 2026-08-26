import TrialOfferScreen from "@/components/TrialOfferScreen";
import { LilyColors } from "@/constants/lily";
import { useSubscription } from "@/hooks/useSubscription";
import { Redirect } from "expo-router";
import { View } from "react-native";

/**
 * The single chokepoint for the trial offer.
 *
 * Several places push here when someone needs a plan — the menu, a rejected send,
 * a failed checkout. Guarding at the route rather than at each of those call sites
 * is what makes the rule hold: anyone who has already had a subscription is sent
 * to their subscription screen, where the action is "Resubscribe", not a free
 * trial they have already used.
 */
export default function Paywall() {
  const { everSubscribed, loading } = useSubscription();

  // Deciding before the plan is known would flash the wrong screen either way.
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: LilyColors.ground }} />;
  }

  if (everSubscribed) {
    return <Redirect href="/(subscription)" />;
  }

  return <TrialOfferScreen />;
}
