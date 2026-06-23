"use client";

import { TabLinkOption, TabLinks } from "@/components/tab-links";
import {
  BracesIcon,
  MessagesSquareIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

const tabLinks = [
  {
    name: "Explore",
    icon: UsersIcon,
    href: "/community",
  },
  {
    name: "Problems",
    icon: BracesIcon,
    href: "/community/problems",
  },
  {
    name: "Chat",
    icon: MessagesSquareIcon,
    href: "/community/chats",
  },
  {
    name: "AI Discover",
    icon: SparklesIcon,
    href: "/community/ai-discover",
  },
] satisfies TabLinkOption[];

export const CommunityTabLinks = () => {
  return <TabLinks options={tabLinks} ariaLabel="Community links" />;
};
