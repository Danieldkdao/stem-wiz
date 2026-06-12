import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentUser } from "@/lib/auth/helpers";
import { LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const UserProfileDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Suspense fallback={<UserProfileDropdownLoading />}>
            <UserProfileDropdownSuspense />
          </Suspense>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/my-profile">
            <UserIcon />
            Your Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" asChild>
          <SignOutButton
            variant="ghost"
            className="justify-start w-full border-0 hover:outline-0! hover:ring-0! hover:border-0!"
          >
            <LogOutIcon />
            Sign Out
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserProfileDropdownLoading = () => {
  return <Skeleton className="size-6 rounded-full" />;
};

const UserProfileDropdownSuspense = async () => {
  const { user } = await getCurrentUser({ allData: true });
  if (!user) return null;

  return <UserAvatar {...user} className="size-6" textClassName="text-xs" />;
};
