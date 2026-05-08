import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { UserActionsButton } from "../user-actions-button";
import { SearchOptionsInput } from "./search-options-input";
import { SearchOption } from "@/lib/types";

const options: SearchOption[] = [
  {
    label: "Dashboard",
    icon: "layout-dashboard",
    href: "/dashboard",
  },
  {
    label: "Arena",
    icon: "landmark-icon",
    href: "/arena",
  },
  {
    label: "Match Up",
    icon: "users-icon",
    href: "/connect",
  },
  {
    label: "The Oracle",
    icon: "sparkles-icon",
    href: "/oracle",
  },
];

export const CommandFooter = () => {
  return (
    <div className="fixed bottom-0 border-2 h-20 z-100 bg-card right-0 left-0 flex items-center gap-4 px-4">
      <SearchOptionsInput
        options={options}
        className="bg-transparent text-lg md:text-lg font-mono dark:bg-transparent border-none ring-0 focus-visible:ring-0 focus-within:border-none focus-visible:outline-0"
        placeholder="Enter a command here..."
      />
      <Suspense fallback={<CommandLoading />}>
        <CommandSuspense />
      </Suspense>
    </div>
  );
};

const CommandLoading = () => {
  return <div>loading</div>;
};

const CommandSuspense = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return <UserActionsButton {...session.user} />;
};
