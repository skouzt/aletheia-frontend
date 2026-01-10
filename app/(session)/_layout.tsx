import { Stack } from "expo-router";

export default function SessionLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        animation: "slide_from_bottom",
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
