"use client";

import { Controller, useForm } from "react-hook-form";
import { chatInputSchema, ChatInputSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import { createMatchChatMessageAction } from "../actions/actions";
import { toast } from "sonner";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useMatchObserverSocket } from "@/features/matches/hooks/use-match-observer-socket";

export const MatchChatInput = ({ matchId }: { matchId: string }) => {
  const { broadcastChatMessageSent } = useMatchObserverSocket();
  const form = useForm<ChatInputSchemaType>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      text: "",
    },
  });

  const sendChatMessage = async (data: ChatInputSchemaType) => {
    const response = await createMatchChatMessageAction(matchId, data);
    if (response.error || !response.chatMessage) {
      toast.error(response.message);
    } else {
      const message = response.chatMessage;
      form.reset();
      broadcastChatMessageSent({
        chatId: message.chatId,
        matchId,
        messageId: message.id,
      });
    }
  };

  return (
    <div className="w-full p-4 bg-card">
      <form
        onSubmit={form.handleSubmit(sendChatMessage)}
        className="flex flex-col gap-2 items-end bg-transparent dark:bg-input/30 p-4 rounded-md"
      >
        <Controller
          name="text"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldContent>
                <Textarea
                  className={cn(
                    "w-full border-none ring-0 outline-0 max-h-32 focus-visible:ring-0 focus-visible:outline-0 dark:bg-transparent text-lg md:text-lg",
                    getInputErrorStyle(fieldState.error),
                  )}
                  placeholder="Please be kind and respectful..."
                  onKeyDown={(e) => {
                    if (
                      e.key !== "Enter" ||
                      e.shiftKey ||
                      e.nativeEvent.isComposing ||
                      form.formState.isSubmitting
                    )
                      return;

                    e.preventDefault();
                    void form.handleSubmit(sendChatMessage)();
                  }}
                  {...field}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          size="icon"
          disabled={form.formState.isSubmitting}
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            <SendIcon />
          </LoadingSwap>
        </Button>
      </form>
    </div>
  );
};
