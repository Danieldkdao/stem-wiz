"use client";

import { Controller, useForm } from "react-hook-form";
import { friendChatSchema, FriendChatSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChatTable } from "@/db/schema";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getInputErrorStyle } from "@/lib/utils";
import { FriendsSelect } from "@/features/user/components/friends-select";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useRouter } from "next/navigation";
import {
  createFriendChatAction,
  updateFriendChatAction,
} from "../actions/actions";
import { toast } from "sonner";

export const CreateUpdateFriendChatForm = ({
  existingChat,
}: {
  existingChat?: typeof ChatTable.$inferSelect;
}) => {
  const router = useRouter();
  const form = useForm<FriendChatSchemaType>({
    resolver: zodResolver(friendChatSchema),
    defaultValues: existingChat
      ? {
          title: existingChat.title ?? "",
          friendRequestId: existingChat.friendRequestId ?? undefined,
        }
      : {
          title: "",
        },
  });

  const handleCreateUpdateChat = async (data: FriendChatSchemaType) => {
    const action = existingChat
      ? updateFriendChatAction(existingChat.id, data)
      : createFriendChatAction(data);
    const response: { error: boolean; message: string; chatId?: string } =
      await action;
    if (response.error || !response.chatId) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      if (existingChat) router.refresh();
      else router.push(`/community/chats/${response.chatId}`);
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
        name="friendRequestId"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Friend</FieldLabel>
            <FieldContent>
              <FriendsSelect
                value={value}
                onValueChange={onChange}
                {...props}
                triggerClassName={getInputErrorStyle(fieldState.error)}
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
      <Button disabled={form.formState.isSubmitting}>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingChat ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
