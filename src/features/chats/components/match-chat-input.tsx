"use client";

import { Controller, useForm } from "react-hook-form";
import { chatInputSchema, ChatInputSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

export const MatchChatInput = () => {
  const form = useForm<ChatInputSchemaType>({
    resolver: zodResolver(chatInputSchema),
    defaultValues: {
      text: "",
    },
  });

  const sendChatMessage = async (data: ChatInputSchemaType) => {
    return data;
  };

  return (
    <div className="w-full p-4 bg-card">
      <form className="flex flex-col gap-2 items-end bg-transparent dark:bg-input/30 p-4">
        <Controller
          name="text"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldContent>
                <Textarea
                  className={cn(
                    "w-full border-none ring-0 outline-0 max-h-32 focus-visible:ring-0 focus-visible:outline-0 dark:bg-transparent",
                    getInputErrorStyle(fieldState.error),
                  )}
                  placeholder="Please be kind and respectful..."
                  {...field}
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button size="icon">
          <SendIcon />
        </Button>
      </form>
    </div>
  );
};
