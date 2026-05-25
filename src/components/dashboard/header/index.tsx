import { CodeIcon } from "lucide-react";
import { HeaderClient } from "./header-client";
import { Suspense } from "react";
import { getUserNotificationsAction } from "@/features/notifications/actions/actions";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export const Header = () => {
  return (
    <nav className="w-full p-4 bg-card border-b">
      <div className="flex items-center gap-2 mx-auto w-full max-w-7xl justify-between">
        <Link href="/dashboard">
          <div className="flex items-center gap-2">
            <CodeIcon className="text-primary" />
            <span className="text-xl font-semibold text-primary">Synapse</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Suspense fallback={<HeaderLoading />}>
            <HeaderSuspense />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

const HeaderLoading = () => {
  return <div>loading</div>;
};

const HeaderSuspense = async () => {
  const notifications = await getUserNotificationsAction();
  if (!notifications) {
    return <div>notification error fetching component</div>;
  }

  return <HeaderClient initialNotifications={notifications} />;
};
