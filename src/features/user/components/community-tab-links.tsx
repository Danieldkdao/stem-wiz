"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabsListVariants, tabsTriggerClassName } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MessagesSquareIcon, SparklesIcon, UsersIcon } from "lucide-react";

const tabLinks = [
  {
    name: "Explore",
    icon: UsersIcon,
    pathname: "/community",
  },
  {
    name: "Chat",
    icon: MessagesSquareIcon,
    pathname: "/community/chats",
  },
  {
    name: "AI Discover",
    icon: SparklesIcon,
    pathname: "/community/ai-discover",
  },
];

export const CommunityTabLinks = () => {
  const pathname = usePathname();
  const currentPathname = pathname ?? "";

  return (
    <nav
      aria-label="Community sections"
      data-orientation="horizontal"
      className="group/tabs flex w-full data-horizontal:flex-col"
    >
      <div
        data-slot="tabs-list"
        data-variant="default"
        className={cn(tabsListVariants(), "w-full bg-background/30")}
      >
        {tabLinks.map((tabLink) => {
          const isActive =
            tabLink.pathname === "/community"
              ? currentPathname === tabLink.pathname
              : currentPathname === tabLink.pathname ||
                currentPathname.startsWith(`${tabLink.pathname}/`);

          return (
            <Link
              key={tabLink.name}
              href={tabLink.pathname}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive ? true : undefined}
              className={tabsTriggerClassName}
            >
              <tabLink.icon />
              {tabLink.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
