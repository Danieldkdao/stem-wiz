"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { ChatTable } from "@/db/schema";
import { FriendsSelect } from "@/features/social/components/friends-select";
import { getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createFriendChatAction,
  updateFriendChatAction,
} from "../actions/actions";
import { friendChatSchema, FriendChatSchemaType } from "../actions/schemas";
import { useFriendChatSocket } from "../hooks/use-friend-chat-socket";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { useTransition } from "react";

export const CreateUpdateFriendChatForm = ({
  existingChat,
  afterAction,
}: {
  existingChat?: typeof ChatTable.$inferSelect;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const [isRouting, startRoutingTransition] = useTransition();
  const { broadcastChatCreated, broadcastChatUpdated } = useFriendChatSocket();
  const { notifyFriendChatAction } = useNotificationsSocket();
  const form = useForm<FriendChatSchemaType>({
    resolver: zodResolver(friendChatSchema),
    defaultValues: existingChat
      ? {
          title: existingChat.title ?? "",
          friendshipId: existingChat.friendshipId ?? undefined,
        }
      : {
          title: "",
        },
  });

  const handleCreateUpdateChat = async (data: FriendChatSchemaType) => {
    const action = existingChat
      ? updateFriendChatAction(existingChat.id, data)
      : createFriendChatAction(data);
    const response: {
      error: boolean;
      message: string;
      chatId?: string;
      notificationId?: string;
    } = await action;
    if (response.error || !response.chatId) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      form.reset();
      afterAction?.();
      if (existingChat) {
        broadcastChatUpdated(response.chatId);
        startRoutingTransition(() => {
          router.refresh();
        });
      } else {
        broadcastChatCreated(response.chatId);
        // @ts-expect-error This will always be defined because if
        // existingChat does not exist, then the create action must
        // have ran and since being in this part of the code guarantees
        // no errors occurred, the notification id must be defined.
        notifyFriendChatAction(response.notificationId, "new_chat");
        startRoutingTransition(() => {
          router.push(`/community/chats/${response.chatId}`);
        });
      }
    }
  };

  return (
    <form
      className="w-full flex flex-col gap-4"
      onSubmit={form.handleSubmit(handleCreateUpdateChat)}
    >
      <Controller
        control={form.control}
        name="title"
        render={({ field: { value, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Title</FieldLabel>
            <FieldContent>
              <Input
                value={value ?? ""}
                placeholder="Enter a memorable title..."
                className={getInputErrorStyle(fieldState.error)}
                {...props}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="friendshipId"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Friend</FieldLabel>
            <FieldContent>
              <FriendsSelect
                value={value}
                onValueChange={onChange}
                {...props}
                triggerClassName={getInputErrorStyle(fieldState.error)}
                disabled={!!existingChat}
              />
            </FieldContent>
            <FieldDescription>
              This cannot be updated later. We are working on support for group
              chats.
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button disabled={form.formState.isSubmitting || isRouting}>
        <LoadingSwap isLoading={form.formState.isSubmitting || isRouting}>
          {existingChat ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
