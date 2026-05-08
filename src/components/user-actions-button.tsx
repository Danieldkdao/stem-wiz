"use client";

import { LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UserAvatar } from "./user-avatar";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import { useRouter } from "next/navigation";

type UserActionsButtonProps = {
  name: string;
  image?: string | null;
  email: string;
};

export const UserActionsButton = (user: UserActionsButtonProps) => {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar {...user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="px-4 pt-3 pb-2">
        <div className="flex flex-col gap-0.5 pb-2">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  toast.success("Signed out successfully.");
                  router.push("/sign-in");
                },
                onError: (error) => {
                  console.error(error);
                  toast.error(error.error.message || GENERAL_ERROR_MESSAGE);
                },
              },
            });
          }}
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
