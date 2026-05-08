import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Input } from "../ui/input";
import { UserActionsButton } from "../user-actions-button";

export const CommandFooter = () => {
  return (
    <Suspense fallback={<CommandLoading />}>
      <CommandSuspense />
    </Suspense>
  );
};

const CommandLoading = () => {
  return <div>loading</div>;
};

const CommandSuspense = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return (
    <div className="fixed bottom-0 border-2 h-20 z-100 bg-card right-0 left-0 flex items-center gap-4 px-4">
      <Input
        className="bg-transparent text-lg md:text-lg font-mono dark:bg-transparent border-none ring-0 focus-visible:ring-0 focus-within:border-none focus-visible:outline-0"
        placeholder="Enter a command here..."
      />
      <UserActionsButton {...session.user} />
    </div>
  );
};
