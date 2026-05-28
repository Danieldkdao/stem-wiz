import { create } from "zustand";

type FeedbackGenerationStatus = "idle" | "generating" | "success" | "error";
export type TabValue = "chat" | "feedback";

type OracleStoreType = {
  feedbackGenerationStatus: FeedbackGenerationStatus;
  setFeedbackGenerationStatus: (value: FeedbackGenerationStatus) => void;
  tabValue: TabValue;
  setTabValue: (value: TabValue) => void;
};

export const useOracleStore = create<OracleStoreType>((set) => {
  return {
    feedbackGenerationStatus: "idle",
    setFeedbackGenerationStatus: (value) => {
      set({ feedbackGenerationStatus: value });
    },
    tabValue: "chat",
    setTabValue: (value) => {
      set({ tabValue: value });
    },
  };
});
