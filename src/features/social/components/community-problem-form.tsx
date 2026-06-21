"use client";

import { ControlledInput } from "@/components/controlled-input";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CommunityProblemInvitationTable,
  CommunityProblemTable,
  ProblemTable,
} from "@/db/schema";
import {
  communityProblemStatuses,
  difficultyLevels,
  programmingLanguages,
} from "@/db/shared";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { useNotificationsSocket } from "@/features/notifications/hooks/use-notifications-socket";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createCommunityProblemAction,
  updateCommunityProblemAction,
} from "../actions/actions";
import {
  communityProblemSchema,
  CommunityProblemSchemaType,
} from "../actions/schemas";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
} from "../lib/formatters";
import { FriendsMultiSelect } from "./friends-multi-select";

export const CommunityProblemForm = ({
  existingProblem,
  afterAction,
}: {
  existingProblem?: typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
    invitations: (typeof CommunityProblemInvitationTable.$inferSelect)[];
  };
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const { notifyCommunityProblemFriends } = useNotificationsSocket();
  const form = useForm<CommunityProblemSchemaType>({
    resolver: zodResolver(communityProblemSchema),
    defaultValues: existingProblem
      ? {
          title: existingProblem.problem.title,
          description: existingProblem.problem.description,
          difficultyLevel: existingProblem.problem.difficultyLevel,
          programmingLanguage: existingProblem.problem.programmingLanguage,
          solution: existingProblem.problem.solution,
          concepts: existingProblem.problem.concepts,
          status: existingProblem.status,
          sharedWithUserIds: existingProblem.invitations.map(
            (invitation) => invitation.friendshipId,
          ),
        }
      : {
          title: "",
          description: "",
          difficultyLevel: "easy",
          programmingLanguage: "python",
          solution: "",
          concepts: [],
          status: "private",
          sharedWithUserIds: [],
        },
  });

  const createUpdateCommunityProblem = async (
    data: CommunityProblemSchemaType,
  ) => {
    const action = existingProblem
      ? updateCommunityProblemAction(existingProblem.id, data)
      : createCommunityProblemAction(data);
    const response = await action;
    if (response.error || !response.notificationEvents) {
      toast.error(response.message);
    } else {
      notifyCommunityProblemFriends(response.notificationEvents);
      toast.success(response.message);
      afterAction?.();
      form.reset();
      if (existingProblem) router.refresh();
      // @ts-expect-error This will always be valid because no existing problem = create problem which if no error is thrown will return the problem id
      else router.push(`/community/problems/${response.problemId}`);
      router.refresh();
    }
  };

  const communityProblemStatus = form.watch("status");

  return (
    <form
      onSubmit={form.handleSubmit(createUpdateCommunityProblem)}
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Title</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                className={getInputErrorStyle(fieldState.error)}
                placeholder="Enter a title..."
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="programmingLanguage"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Programming Language</FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange} {...props}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select the programming language used for this problem..." />
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
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="difficultyLevel"
        render={({ field: { value, onChange }, fieldState }) => (
          <Field>
            <FieldLabel>Difficulty Level</FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select a difficulty level..." />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {formatDifficultyLevel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field className="min-w-0">
            <FieldLabel>Description</FieldLabel>
            <FieldContent className="min-w-0">
              <MarkdownEditor value={field.value} onChange={field.onChange} />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="solution"
        render={({ field, fieldState }) => (
          <Field className="min-w-0">
            <FieldLabel>Solution</FieldLabel>
            <FieldContent className="min-w-0">
              <MarkdownEditor value={field.value} onChange={field.onChange} />
            </FieldContent>
            <FieldDescription>
              Make sure to be descriptive and clearly explain the solution
              including the code for the solution (if applicable). Note that
              this will not be shown publicly and used for reusable purposes.
            </FieldDescription>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="concepts"
        render={({
          field: { value: values, onChange, ...props },
          fieldState,
        }) => (
          <Field>
            <FieldLabel>Concepts</FieldLabel>
            <FieldContent className="flex flex-col gap-2">
              <ControlledInput
                onKeyDown={(e, value, setValue) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!value.trim()) return;
                    if (values.length >= 5) return;
                    onChange([...values, value]);
                    setValue("");
                  }
                }}
                {...props}
                placeholder="Enter related concepts..."
                className={getInputErrorStyle(fieldState.error)}
              />
              <div className="flex items-center gap-2">
                {values.map((value) => (
                  <TooltipWrapper key={value} content="Click to remove">
                    <Badge
                      className="capitalize flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        onChange(values.filter((v) => v !== value))
                      }
                    >
                      {value}
                      <XIcon className="size-4 text-destructive" />
                    </Badge>
                  </TooltipWrapper>
                ))}
              </div>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="status"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Status</FieldLabel>
            <FieldContent>
              <Select value={value} onValueChange={onChange} {...props}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select visibility status...">
                    {value ? (
                      <span className="min-w-0 font-medium truncate">
                        {formatCommunityProblemStatus(value).label}
                      </span>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {communityProblemStatuses.map((status) => {
                    const { label, description } =
                      formatCommunityProblemStatus(status);
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex flex-col gap-0.5 items-start">
                          <span className="font-semibold text-base">
                            {label}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        )}
      />
      {communityProblemStatus === "private" && (
        <Controller
          control={form.control}
          name="sharedWithUserIds"
          render={({ field: { value: values, onChange }, fieldState }) => (
            <Field>
              <FieldLabel>Share with</FieldLabel>
              <FieldContent>
                <FriendsMultiSelect
                  values={values}
                  onValuesChange={onChange}
                  triggerClassName={getInputErrorStyle(fieldState.error)}
                />
              </FieldContent>
              <FieldDescription>
                Choose which friends to share this problem with. Only you and
                the friends you select will be able to read this problem.
              </FieldDescription>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}

      <Button
        className="w-full"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
        type="submit"
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingProblem ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
