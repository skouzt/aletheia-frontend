import { Stack } from "expo-router";

export default function ModalLayout() {
  

  return (
    <Stack
      screenOptions={{
        presentation: "transparentModal",
        headerShown: false,
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
    
  );
}
