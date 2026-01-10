import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  name: string;
  age: string;
  gender: string;
  support_style: string;
  Current_Difficulty: string;
  Duration: string;
  Daily_Impact: string;
  Coping_Style: string;
  Support_Network: string;
  Safety_Check: string;

  setValue: (key: keyof OnboardingState, value: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create(
  persist<OnboardingState>(
    (set) => ({
      name: "",
      age: "",
      gender: "",
      support_style: "",
      Current_Difficulty: "",
      Duration: "",
      Daily_Impact: "",
      Coping_Style: "",
      Support_Network: "",
      Safety_Check: "",

      setValue: (key, value) => set({ [key]: value }),
      reset: () =>
        set({
          name: "",
          age: "",
          gender: "",
          support_style: "",
          Current_Difficulty: "",
          Duration: "",
          Daily_Impact: "",
          Coping_Style: "",
          Support_Network: "",
          Safety_Check: "",
        }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
