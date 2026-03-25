import BottomNavBar from "@/components/navbar";
import { TabTransitionProvider, useTabTransition } from "@/context/tab-transition";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";

const TAB_ORDER = ["home", "summary", "setting"] as const;
type Tab = (typeof TAB_ORDER)[number];
const OFFSET = 40;

function TabLayoutInner() {
  const pathname = usePathname();
  const router = useRouter();
  const { incomingOffset } = useTabTransition();

  const getActiveTab = (): Tab => {
    if (pathname.includes("summary")) return "summary";
    if (pathname.includes("setting")) return "setting";
    return "home";
  };

  const [tab, setTab] = useState<Tab>(getActiveTab());

  useEffect(() => {
    setTab(getActiveTab());
  }, [pathname]);

  const handleTabPress = (newTab: Tab) => {
    if (tab === newTab) return;

    const oldIndex = TAB_ORDER.indexOf(tab);
    const newIndex = TAB_ORDER.indexOf(newTab);

    // Set offset BEFORE navigation — new screen reads this at construction
    incomingOffset.value = newIndex > oldIndex ? OFFSET : -OFFSET;

    setTab(newTab);
    router.replace(`/${newTab}`);
  };

  return (
    <>
      <Tabs screenOptions={{ tabBarStyle: { display: "none" }, headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="summary" />
        <Tabs.Screen name="setting" />
      </Tabs>
      <BottomNavBar activeTab={tab} onTabPress={handleTabPress} />
    </>
  );
}

export default function TabLayout() {
  return (
    <TabTransitionProvider>
      <TabLayoutInner />
    </TabTransitionProvider>
  );
}