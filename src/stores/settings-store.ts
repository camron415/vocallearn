import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type LessonPace = "standard" | "slower";

interface SettingsState {
  mode: "voice" | "write" | "both";
  handsFreeMode: boolean;
  backgroundAudioEnabled: boolean;
  lessonPace: LessonPace;
  notificationStyle: "random" | "scheduled" | "off";
  dailyGoalMinutes: number;
  setMode: (mode: "voice" | "write" | "both") => void;
  setHandsFreeMode: (enabled: boolean) => void;
  setBackgroundAudioEnabled: (enabled: boolean) => void;
  setLessonPace: (pace: LessonPace) => void;
  setNotificationStyle: (style: "random" | "scheduled" | "off") => void;
  setDailyGoal: (minutes: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "both",
      handsFreeMode: false,
      backgroundAudioEnabled: false,
      lessonPace: "standard",
      notificationStyle: "scheduled",
      dailyGoalMinutes: 30,

      setMode: (mode) => set({ mode }),
      setHandsFreeMode: (handsFreeMode) => set({ handsFreeMode }),
      setBackgroundAudioEnabled: (backgroundAudioEnabled) => set({ backgroundAudioEnabled }),
      setLessonPace: (lessonPace) => set({ lessonPace }),
      setNotificationStyle: (notificationStyle) => set({ notificationStyle }),
      setDailyGoal: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
    }),
    {
      name: "vocallearn-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
