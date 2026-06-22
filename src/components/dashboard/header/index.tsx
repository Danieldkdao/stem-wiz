import { CodeIcon } from "lucide-react";
import { HeaderClient } from "./header-client";
import { Suspense } from "react";
import { getUserNotificationsAction } from "@/features/notifications/actions/actions";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_PAGE } from "@/lib/constants";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { HeaderLinksMobileDropdown } from "./header-links-mobile-dropdown";
import { ErrorState } from "@/components/error-state";

const headerLinks = [
  {
    displayText: "Arena",
    href: "/arena",
  },
  {
    displayText: "Community",
    href: "/community",
  },
  {
    displayText: "The Oracle",
    href: "/oracle/sessions",
  },
];

export const Header = () => {
  return (
    <nav className="w-full p-4 bg-card border-b">
      <div className="flex items-center gap-2 mx-auto w-full max-w-7xl justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <div className="flex items-center gap-2">
              <CodeIcon className="text-primary" />
              <span className="text-xl font-semibold text-primary">
                Synapse
              </span>
            </div>
          </Link>
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium hidden md:block"
            >
              {link.displayText}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Suspense fallback={<HeaderLoading />}>
            <HeaderSuspense />
          </Suspense>
          <UserProfileDropdown />
          <HeaderLinksMobileDropdown headerLinks={headerLinks} />
        </div>
      </div>
    </nav>
  );
};

const HeaderLoading = () => {
  return <Skeleton className="size-9 rounded-md" />;
};

const HeaderSuspense = async () => {
  const response = await getUserNotificationsAction(DEFAULT_PAGE);
  if (!response) {
    return (
      <ErrorState
        title="Fetch Error"
        description="We were unable to fetch your notifications. Try refreshing the page or come back later. "
      />
    );
  }

  const { notificationListItems, metadata } = response;

  return (
    <HeaderClient
      initialNotifications={notificationListItems}
      initialHasNextPage={metadata.hasNextPage}
    />
  );
};
