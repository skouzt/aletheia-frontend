import { createContext, useContext, useRef, type MutableRefObject } from "react";
import { useSharedValue } from "react-native-reanimated";

type TabTransitionContextType = {
  incomingOffset: ReturnType<typeof useSharedValue<number>>;
  onSlideComplete: MutableRefObject<(() => void) | null>;
};

const TabTransitionContext = createContext<TabTransitionContextType>(null!);

export function TabTransitionProvider({ children }: { children: React.ReactNode }) {
  const incomingOffset = useSharedValue(0);
  const onSlideComplete = useRef<(() => void) | null>(null);

  return (
    <TabTransitionContext.Provider value={{ incomingOffset, onSlideComplete }}>
      {children}
    </TabTransitionContext.Provider>
  );
}

export const useTabTransition = () => useContext(TabTransitionContext);
