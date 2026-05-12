import { create } from "zustand";

type MatchStoreType = {
  isEnding: boolean;
  setIsEnding: (value: boolean) => void;
};

export const useMatchStore = create<MatchStoreType>((set) => {
  return {
    isEnding: false,
    setIsEnding: (value) => {
      set({ isEnding: value });
    },
  };
});
