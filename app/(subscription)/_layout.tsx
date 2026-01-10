import { Stack } from "expo-router";

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        animation: "slide_from_bottom",
        gestureEnabled: true,
      }}
    >
      {/* Plan selection / upgrade */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      {/* Manage active subscription */}
      <Stack.Screen
        name="manage"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="plans"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="changeplan"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
