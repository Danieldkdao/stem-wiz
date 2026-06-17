"use client";

import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { ChatMessageTable } from "@/db/schema";
import { SetterType } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  sendFriendChatMessageAction,
  updateFriendChatMessageAction,
} from "../actions/actions";
import { chatInputSchema, ChatInputSchemaType } from "../actions/schemas";
import { useFriendChatSocket } from "../hooks/use-friend-chat-socket";

export const FriendChatMessageInput = ({
  chatId,
  existingChatMessage,
  setIsUpdating,
}: {
  chatId: string;
  existingChatMessage?: typeof ChatMessageTable.$inferSelect;
  setIsUpdating?: SetterType<boolean>;
}) => {
  const router = useRouter();
  const { sendChatMessage: sendChatMessageSocket, broadcastMessageUpdates } =
    useFriendChatSocket();
  const form = useForm<ChatInputSchemaType>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      text: existingChatMessage?.text ?? "",
    },
  });

  const sendChatMessage = async (data: ChatInputSchemaType) => {
    const action = existingChatMessage
      ? updateFriendChatMessageAction(chatId, existingChatMessage.id, data)
      : sendFriendChatMessageAction(chatId, data);
    const response = await action;
    if (response.error || !response.chatMessage) {
      toast.error(response.message);
    } else {
      const socketAction = existingChatMessage
        ? broadcastMessageUpdates
        : sendChatMessageSocket;
      socketAction(response.chatMessage.id);
      form.reset();
      router.refresh();
      setIsUpdating?.(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(sendChatMessage)}
      className="w-full flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="text"
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <MarkdownEditor
                value={field.value}
                onChange={field.onChange}
                height={200}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="self-end flex items-center gap-2">
        {setIsUpdating && existingChatMessage && (
          <Button variant="outline" onClick={() => setIsUpdating(false)}>
            Cancel
          </Button>
        )}
        <Button
          disabled={form.formState.isSubmitting}
          className="self-end"
          variant="default"
          size={existingChatMessage ? "default" : "icon"}
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {existingChatMessage ? "Save changes" : <SendIcon />}
          </LoadingSwap>
        </Button>
      </div>
    </form>
  );
};
