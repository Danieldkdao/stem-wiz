"use client";

import { Button } from "@/components/ui/button";
import { DatePickerTime } from "@/components/ui/date-picker-time";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { programmingLanguages } from "@/db/shared";
import { FriendCommandSelect } from "@/features/friends/components/friend-command-select";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { CommunityProblemCommandSelect } from "@/features/social/components/community-problem-command-select.tsx";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";
import { cn, getDuration, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistance } from "date-fns";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createMatchRequestAction } from "../actions/actions";
import {
  friendMatchRequestSchema,
  FriendMatchRequestSchemaType,
  problemSources,
} from "../actions/schemas";
import { formatProblemSource } from "../lib/formatters";

export const FriendMatchRequestForm = () => {
  const router = useRouter();
  const { notifyNewFriendMatchRequest } = useNotificationsSocket();
  const form = useForm<FriendMatchRequestSchemaType>({
    resolver: zodResolver(friendMatchRequestSchema),
    defaultValues: {
      problemSource: "user",
      programmingLanguage: undefined,
      problemId: undefined,
      recipientFriendshipId: undefined,
      expiresAt: undefined,
      timeLimit: undefined,
    },
  });

  const createUpdateFriendMatchRequest = async (
    data: FriendMatchRequestSchemaType,
  ) => {
    const response = await createMatchRequestAction(data);
    if (
      response.error ||
      !response.notificationId ||
      !response.matchRequestId
    ) {
      toast.error(response.message);
    } else {
      notifyNewFriendMatchRequest(response.notificationId);
      toast.success(response.message);
      form.reset();
      router.push(
        `/match-invitations/requests-sent/${response.matchRequestId}`,
      );
    }
  };

  const problemSource = form.watch("problemSource");

  return (
    <form
      onSubmit={form.handleSubmit(createUpdateFriendMatchRequest)}
      className="w-full flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="problemSource"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Problem Source</FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange} {...props}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select the problem source...">
                    <span className="font-medium">
                      {formatProblemSource(value).label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {problemSources.map((source) => {
                    const { label, description } = formatProblemSource(source);

                    return (
                      <SelectItem key={source} value={source}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-base font-medium">{label}</span>
                          <span className="text-sm text-muted-foreground">
                            {description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FieldContent>
            <FieldDescription>
              {formatProblemSource(value).description}
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {problemSource === "user" ? (
        <Controller
          control={form.control}
          name="problemId"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Community Problem</FieldLabel>
              <FieldContent>
                <CommunityProblemCommandSelect
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  className={getInputErrorStyle(fieldState.error)}
                  type="button"
                />
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      ) : (
        <>
          <Controller
            control={form.control}
            name="programmingLanguage"
            render={({ field: { value, onChange, ...props }, fieldState }) => (
              <Field>
                <FieldLabel>Programming Language</FieldLabel>
                <FieldContent>
                  <Select
                    value={value ?? ""}
                    onValueChange={onChange}
                    {...props}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        getInputErrorStyle(fieldState.error),
                      )}
                    >
                      <SelectValue placeholder="Select a programming language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {programmingLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {formatProgrammingLanguage(language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            )}
          ></Controller>
          <Controller
            control={form.control}
            name="prompt"
            render={({ field: { value, ...props }, fieldState }) => (
              <Field>
                <FieldLabel>AI Instructions</FieldLabel>
                <FieldContent>
                  <Textarea
                    value={value ?? ""}
                    {...props}
                    className="max-h-32"
                    placeholder="Additional information or instructions that the AI should know before generating your problem."
                  />
                </FieldContent>
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </>
      )}
      <Controller
        control={form.control}
        name="recipientFriendshipId"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Friend to challenge</FieldLabel>
            <FieldContent>
              <FriendCommandSelect
                value={field.value}
                onValueChange={field.onChange}
                className={getInputErrorStyle(fieldState.error)}
                type="button"
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="timeLimit"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Time Limit (s)</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                placeholder="Set a time limit for the match..."
                value={
                  field.value === undefined || field.value === null
                    ? ""
                    : field.value
                }
                onChange={(e) =>
                  field.onChange(
                    !Number.isNaN(e.target.valueAsNumber)
                      ? e.target.valueAsNumber
                      : undefined,
                  )
                }
                step={1}
                min={300}
                max={10800}
              />
            </FieldContent>
            {field.value && (
              <span>
                Duration:{" "}
                <span className="font-medium">
                  {getDuration(undefined, undefined, field.value)}
                </span>
              </span>
            )}
            <FieldDescription>
              This is optional. If not provided, the match will not have a time
              limit and only end when both players have submitted their code.
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="expiresAt"
        render={({ field, fieldState }) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          return (
            <Field>
              <FieldLabel>Expires At</FieldLabel>
              <FieldContent>
                <DatePickerTime
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                  showLabels={false}
                  inputClassName={getInputErrorStyle(fieldState.error)}
                  disabled={{ before: today }}
                />
              </FieldContent>
              {field.value && (
                <span>
                  Expires in {formatDistance(field.value, new Date())}
                </span>
              )}
              <FieldDescription>
                This is optional. If provided, the request will expire after the
                provided date and your friend will be unable to respond.
              </FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
      <Button disabled={form.formState.isSubmitting}>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          Send match request
        </LoadingSwap>
      </Button>
    </form>
  );
};
