import { create } from "zustand";

type PendingActionStoreType = {
  isPending: boolean;
  setIsPending: (value: boolean) => void;
};

export const usePendingActionStore = create<PendingActionStoreType>((set) => ({
  isPending: false,
  setIsPending: (value) => set({ isPending: value }),
}));
