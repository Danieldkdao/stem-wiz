"use client";

import { UserAvatar } from "@/components/user-avatar";
import { useEffect, useState } from "react";

const imageItems = [
  {
    id: 1,
    image: "/profiles/profile_alison.png",
    name: "Allison",
  },
  {
    id: 2,
    image: "/profiles/profile_enrique.png",
    name: "Enrique",
  },
  {
    id: 3,
    image: "/profiles/profile_marco.png",
    name: "Marco",
  },
  {
    id: 4,
    image: "/profiles/profile_martin.png",
    name: "Martin",
  },
  {
    id: 5,
    image: "/profiles/profile_richard.png",
    name: "Richard",
  },
];

export const FindingMatchLoader = () => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const currentItem = imageItems[currentItemIndex] ?? {
    id: 10,
    name: "Unknown",
    image: undefined,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentItemIndex((prev) => (prev + 1) % imageItems.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex w-28 flex-col items-center gap-2">
      <div
        className="relative grid size-28 place-items-center"
        aria-label="Finding match"
      >
        <div className="absolute inset-0 rounded-full border border-primary/15" />
        <div className="absolute inset-2 rounded-full border border-dashed border-primary/35 animate-spin animation-duration-[6s]" />
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin animation-duration-[1.35s]" />
        <div className="absolute inset-0 animate-spin animation-duration-[3.2s]">
          <span className="absolute left-1/2 top-1 size-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_16px_var(--primary)]" />
          <span className="absolute bottom-3 right-4 size-1.5 rounded-full bg-chart-3 shadow-[0_0_12px_var(--chart-3)]" />
          <span className="absolute left-3 top-16 size-1.5 rounded-full bg-chart-2 shadow-[0_0_12px_var(--chart-2)]" />
        </div>

        <div
          key={currentItem.id}
          className="relative rounded-full bg-card p-1 shadow-lg ring-1 ring-border animate-in fade-in zoom-in-90 slide-in-from-bottom-1 duration-500"
        >
          <UserAvatar
            {...currentItem}
            className="size-20"
            textClassName="text-2xl font-medium"
          />
        </div>
      </div>

      <div className="flex h-9 flex-col items-center justify-start gap-1">
        <span
          key={currentItem.name}
          className="max-w-28 truncate text-xl font-bold animate-in fade-in slide-in-from-bottom-1 duration-500"
        >
          {currentItem.name}
        </span>

        <div className="flex h-2 items-center gap-1" aria-hidden="true">
          <span className="size-1 rounded-full bg-primary/40 animate-pulse" />
          <span className="size-1 rounded-full bg-primary/70 animate-pulse [animation-delay:150ms]" />
          <span className="size-1 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
};
