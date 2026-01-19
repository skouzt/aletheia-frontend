import BottomNavBar from "@/components/navbar";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = (): "home" | "summary" | "setting" => {
    if (pathname.includes("summary")) return "summary";
    if (pathname.includes("setting")) return "setting";
    return "home";
  };

  const [tab, setTab] = useState<"home" | "summary" | "setting">(getActiveTab());

  useEffect(() => {
    setTab(getActiveTab());
  }, [pathname]);

 // TabLayout.tsx
const handleTabPress = (newTab: "home" | "summary" | "setting") => {
  // ✅ Don't navigate if already on this tab
  if (tab === newTab) return;
  
  setTab(newTab);
  router.push(`/${newTab}`);
};
  return (
    <>
      <Tabs screenOptions={{ tabBarStyle: { display: "none" }, headerShown: false, }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="summary" />
        <Tabs.Screen name="setting" />
      </Tabs>

      <BottomNavBar activeTab={tab} onTabPress={handleTabPress} />
    </>
  );
}
