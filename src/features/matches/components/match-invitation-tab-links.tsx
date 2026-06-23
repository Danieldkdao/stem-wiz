"use client";

import { TabLinkOption, TabLinks } from "@/components/tab-links";
import { MailIcon, RadioIcon } from "lucide-react";

const options = [
  {
    name: "Match requests",
    icon: MailIcon,
    href: "/match-invitations/requests",
  },
  {
    name: "Observer invitations",
    icon: RadioIcon,
    href: "/match-invitations/observer-invitations",
  },
] satisfies TabLinkOption[];

export const MatchInvitationTabLinks = () => {
  return <TabLinks options={options} ariaLabel="Match invitation links" />;
};
