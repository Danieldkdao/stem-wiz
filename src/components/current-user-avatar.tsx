"use client";

import { useAuthSession } from "@/hooks/use-auth-session";
import { UserAvatar } from "./user-avatar";
import { Skeleton } from "./ui/skeleton";

export const CurrentUserAvatar = (props: {
  className?: string;
  textClassName?: string;
}) => {
  const { data: session } = useAuthSession();

  if (!session) return <Skeleton className="size-6 rounded-full" />;

  return (
    <UserAvatar
      name={session.user.name}
      image={session.user.image}
      {...props}
    />
  );
};
