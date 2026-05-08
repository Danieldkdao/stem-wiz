import { LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { UserAvatar } from "./user-avatar";

type UserActionsButtonProps = {
  name: string;
  image?: string | null;
  email: string;
};

export const UserActionsButton = (user: UserActionsButtonProps) => {
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
        <DropdownMenuItem variant="destructive">
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
