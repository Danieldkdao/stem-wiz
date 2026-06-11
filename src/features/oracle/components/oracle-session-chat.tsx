"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { ChatMessageTable, ChatTable } from "@/db/schema";
import {
  chatInputSchema,
  ChatInputSchemaType,
} from "@/features/chats/actions/schemas";
import { useAuthSession } from "@/hooks/use-auth-session";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotIcon, MessageSquareIcon, SendIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { useRouter } from "next/navigation";

export const OracleSessionChat = ({
  sessionId,
  problemId,
  chat,
}: {
  sessionId: string;
  problemId: string;
  chat:
    | (typeof ChatTable.$inferSelect & {
        messages: (typeof ChatMessageTable.$inferSelect)[];
      })
    | null
    | undefined;
}) => {
  const chatMessages = chat?.messages;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: userSession } = useAuthSession();
  const form = useForm<ChatInputSchemaType>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      text: "",
    },
  });
  const { sendMessage, messages, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/oracle/chat",
      body: {
        sessionId,
        problemId,
      },
    }),
    messages: (chatMessages ?? []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: [{ type: "text", text: msg.text }],
      createdAt: msg.createdAt,
    })),
    onFinish: () => {
      router.refresh();
    },
  });

  const sendChatMessage = (data: ChatInputSchemaType) => {
    sendMessage({ text: data.text });
    form.reset();
  };

  const submittedStatus = status === "submitted";
  const streamingStatus = status === "streaming";
  const errorStatus = status === "error";

  useEffect(() => {
    if (streamingStatus) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      behavior: "smooth",
      top: container.scrollHeight,
    });
  }, [messages, streamingStatus]);

  useEffect(() => {
    setMessages(
      (chatMessages ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: "text", text: msg.text }],
        createdAt: msg.createdAt,
      })),
    );
  }, [chatMessages]);

  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col">
      <div
        ref={scrollContainerRef}
        className={cn(
          "p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-4",
          (submittedStatus || streamingStatus) && "pb-32",
        )}
      >
        {messages?.length && userSession?.user ? (
          messages.map((message) => (
            <div
              className={cn(
                "flex w-full min-w-0 flex-col gap-2 rounded-md p-4",
                message.role === "user" && "bg-background",
              )}
              key={message.id}
            >
              <div className="flex w-full min-w-0 items-start gap-2.5">
                {message.role === "user" ? (
                  <UserAvatar {...userSession.user} />
                ) : (
                  <div className="size-8 shrink-0 rounded-full flex items-center justify-center bg-muted border border-border">
                    <BotIcon className="text-primary" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-x-hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="truncate text-lg font-medium">
                      {message.role === "user"
                        ? `${userSession.user.name} (You)`
                        : "The Oracle"}
                    </h2>
                    <span>•</span>
                    <span className="shrink-0">
                      {(message.createdAt ?? new Date()).toDateString()}
                    </span>
                  </div>

                  {message.role === "user" ? (
                    <p className="min-w-0 max-w-full wrap-break-word text-base text-muted-foreground">
                      {message.parts.map((part) => part.text).join("")}
                    </p>
                  ) : (
                    <MarkdownRenderer className="min-w-0 max-w-full text-base">
                      {message.parts.map((part) => part.text).join("")}
                    </MarkdownRenderer>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full h-full p-4 rounded-md border-2 border-dashed border-border flex justify-center items-center">
            <div className="flex flex-col gap-2 items-center">
              <MessageSquareIcon className="size-10" />
              <h1 className="text-lg font-semibold">No Chat Messages Yet</h1>
              <p className="text-base text-muted-foreground">
                Ask a question to start.
              </p>
            </div>
          </div>
        )}
        {submittedStatus ? (
          <div className="rounded-md p-4 flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <div className="size-8 shrink-0 rounded-full flex items-center justify-center bg-muted border border-border">
                <BotIcon className="text-primary" />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium">The Oracle</h2>
                  <span>•</span>
                  <span>Now</span>
                </div>

                <div
                  className="flex items-center gap-1 py-2"
                  role="status"
                  aria-label="The Oracle is thinking"
                >
                  <span className="sr-only">The Oracle is thinking...</span>
                  {[0, 140, 280].map((delay) => (
                    <span
                      key={delay}
                      className="size-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : errorStatus ? (
          <div className="p-4 flex flex-col gap-0.5 rounded-md bg-destructive/30 border-2 border-destructive border-dashed">
            <span className="text-lg font-semibold text-destructive">
              An error occurred
            </span>
            <span className="text-base text-destructive">
              {error ? JSON.stringify(error) : "Something went wrong."}
            </span>
          </div>
        ) : null}
      </div>
      <div className="w-full p-4">
        <form
          onSubmit={form.handleSubmit(sendChatMessage)}
          className="flex flex-col gap-2 items-end bg-transparent border dark:border-none dark:bg-input/30 p-4 rounded-md"
        >
          <Controller
            name="text"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldContent>
                  <Textarea
                    className={cn(
                      "w-full border-none shadow-none ring-0 outline-0 max-h-32 focus-visible:ring-0 focus-visible:outline-0 dark:bg-transparent text-lg md:text-lg",
                      getInputErrorStyle(fieldState.error),
                    )}
                    placeholder="Your prompt goes here..."
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
            disabled={
              form.formState.isSubmitting || streamingStatus || submittedStatus
            }
          >
            <LoadingSwap isLoading={form.formState.isSubmitting}>
              <SendIcon />
            </LoadingSwap>
          </Button>
        </form>
      </div>
    </div>
  );
};
