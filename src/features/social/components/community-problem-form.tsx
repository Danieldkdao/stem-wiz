"use client";

import { Controller, useForm } from "react-hook-form";
import {
  communityProblemSchema,
  CommunityProblemSchemaType,
} from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn, getInputErrorStyle } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  communityProblemStatuses,
  difficultyLevels,
  programmingLanguages,
} from "@/db/shared";
import {
  formatCommunityProblemStatus,
  formatProgrammingLanguage,
} from "../lib/formatters";
import { formatDifficultyLevel } from "@/features/arena-problems/lib/formatters";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ControlledInput } from "@/components/controlled-input";
import { Badge } from "@/components/ui/badge";
import { CommunityProblemTable, ProblemTable } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { XIcon } from "lucide-react";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import {
  createCommunityProblemAction,
  updateCommunityProblemAction,
} from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const CommunityProblemForm = ({
  existingProblem,
  afterAction,
}: {
  existingProblem?: typeof CommunityProblemTable.$inferSelect & {
    problem: typeof ProblemTable.$inferSelect;
  };
  afterAction?: () => void;
}) => {
  const router = useRouter();
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
          // todo: implement shared with user ids when you have the table
          sharedWithUserIds: [],
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
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      afterAction?.();
      form.reset();
      router.refresh();
    }
  };

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
      <Button
        className="w-full"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingProblem ? "Save changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
