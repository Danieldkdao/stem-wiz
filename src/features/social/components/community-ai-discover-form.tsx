"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  communityAiDiscoverSchema,
  CommunityAiDiscoverSchemaType,
} from "../actions/schemas";
import { aiDiscoverUsersAction } from "../actions/actions";
import { useRouter } from "next/navigation";
import { LoadingSwap } from "@/components/ui/loading-swap";

export const CommunityAiDiscoverForm = () => {
  const router = useRouter();
  const form = useForm<CommunityAiDiscoverSchemaType>({
    resolver: zodResolver(communityAiDiscoverSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const handleAiDiscover = async ({
    prompt,
  }: CommunityAiDiscoverSchemaType) => {
    const response = await aiDiscoverUsersAction(prompt);
    if (response.error || !response.userIds || !response.explanation) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      const searchParams = new URLSearchParams({
        userIds: response.userIds.join(","),
        explanation: response.explanation,
      });
      router.push(`/community?${searchParams.toString()}`);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleAiDiscover)}
      className="w-full flex flex-col gap-2 max-w-250 mx-auto bg-card rounded-md border p-4 shadow-sm"
    >
      <Controller
        control={form.control}
        name="prompt"
        render={({ field, fieldState }) => (
          <Field>
            <FieldContent>
              <Textarea
                className={cn(
                  "max-h-32 w-full shadow-none dark:bg-transparent border-none focus-visible:outline-0 focus-visible:ring-0 text-lg md:text-lg",
                  getInputErrorStyle(fieldState.error),
                )}
                placeholder="I am looking for other developers who are looking for hackathon partners, use Python, and have at least 2 years of experience."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void form.handleSubmit(handleAiDiscover)();
                  }
                }}
                {...field}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button
        className="self-end"
        size="icon"
        disabled={form.formState.isSubmitting}
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          <SendIcon />
        </LoadingSwap>
      </Button>
    </form>
  );
};
