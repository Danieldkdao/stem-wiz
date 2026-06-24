"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { UserAvatar } from "@/components/user-avatar";
import { FriendCommandMultiSelect } from "@/features/friends/components/friend-command-multi-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import {
  matchObserverInvitationSchema,
  MatchObserverInvitationSchemaType,
} from "../actions/schemas";
import { sendMatchObserverInvitationsAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";

export const MatchObserverInvitationsForm = ({
  matchId,
}: {
  matchId: string;
}) => {
  const router = useRouter();
  const { notifyNewMatchObserverInvitations } = useNotificationsSocket();
  const form = useForm<MatchObserverInvitationSchemaType>({
    resolver: zodResolver(matchObserverInvitationSchema),
    defaultValues: {
      friends: [],
    },
  });

  const handleSendMatchObserverInvitations = async (
    data: MatchObserverInvitationSchemaType,
  ) => {
    const response = await sendMatchObserverInvitationsAction(matchId, data);
    if (response.error || !response.notificationIds) {
      toast.error(response.message);
    } else {
      const sent = notifyNewMatchObserverInvitations(response.notificationIds);
      if (!sent)
        toast.warning("Notifications were created but not sent realtime.");
      toast.success(response.message);
      form.reset();
      router.refresh();
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSendMatchObserverInvitations)}
      className="flex flex-col gap-2 w-full min-w-0"
    >
      <Controller
        control={form.control}
        name="friends"
        render={({
          field: { value: values, onChange: onValuesChange },
          fieldState,
        }) => (
          <Field>
            <FieldLabel>Friends</FieldLabel>
            <FieldContent>
              <FriendCommandMultiSelect
                type="button"
                matchId={matchId}
                values={values}
                onValuesChange={onValuesChange}
              />
            </FieldContent>
            <div className="w-full flex flex-col gap-2 min-w-0">
              {values.map((value) => (
                <div
                  key={value.id}
                  className="w-full min-w-0 flex items-center gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <UserAvatar name={value.name} image={value.image} />
                    <span className="text-base font-medium flex-1 min-w-0 truncate">
                      {value.name}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="shrink-0"
                    onClick={() =>
                      onValuesChange(
                        values.filter((friend) => friend.id !== value.id),
                      )
                    }
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
            </div>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button disabled={form.formState.isSubmitting} className="w-full">
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          Invite friends
        </LoadingSwap>
      </Button>
    </form>
  );
};
