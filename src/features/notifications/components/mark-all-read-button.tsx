import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ComponentProps, ReactNode, useTransition } from "react";
import { toast } from "sonner";
import { markUserNotificationsReadAction } from "../actions/actions";

export const MarkNotificationsReadButton = ({
  children,
  notificationId,
  disabled,
  onClick,
  onMarkOptimisticRead,
  ...props
}: {
  children: ReactNode;
  notificationId?: string;
  onMarkOptimisticRead?: () => void;
} & ComponentProps<typeof Button>) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkNotificationsAsRead = async () => {
    if (isPending) return;

    startTransition(async () => {
      onMarkOptimisticRead?.();

      const response = await markUserNotificationsReadAction(notificationId);
      if (response.error || !response.notificationIds) {
        toast.error(response.message);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Button
      disabled={isPending || disabled}
      onClick={handleMarkNotificationsAsRead}
      {...props}
    >
      {children}
    </Button>
  );
};
