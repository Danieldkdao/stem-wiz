"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { oracleSessionModes, programmingLanguages } from "@/db/shared";
import { SetterType } from "@/lib/types";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComponentProps, ReactNode, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  oracleSessionActionSchema,
  OracleSessionActionSchemaType,
} from "../actions/schemas";
import { formatOracleSessionMode } from "../lib/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createNewSessionAction,
  updateSessionAction,
} from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { OracleSession } from "../lib/types";
import { formatProgrammingLanguage } from "@/features/social/lib/formatters";

type CreateUpdateSessionDialogProps = {
  open?: boolean;
  setOpen?: SetterType<boolean>;
  useButton: boolean;
  buttonChildren?: ReactNode;
  existingSession?: OracleSession;
} & ComponentProps<typeof Button>;

export const CreateUpdateSessionDialog = ({
  open,
  setOpen,
  useButton = false,
  buttonChildren,
  existingSession,
  onClick,
  ...buttonProps
}: CreateUpdateSessionDialogProps) => {
  const router = useRouter();
  const [hasChildrenOpen, setHasChildrenOpen] = useState(false);
  const [startAfterCreation, setStartAfterCreation] =
    useState(!existingSession);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const form = useForm<OracleSessionActionSchemaType>({
    resolver: zodResolver(oracleSessionActionSchema),
    defaultValues: existingSession
      ? {
          title: existingSession.title,
          additionalInstructions:
            existingSession.additionalInstructions ?? undefined,
          description: existingSession.description ?? undefined,
          mode: existingSession.mode,
          numberOfProblems: existingSession.numberOfProblems,
          programmingLanguage: existingSession.programmingLanguage,
        }
      : {
          additionalInstructions: "",
        },
  });

  const handleSessionCreation = async (data: OracleSessionActionSchemaType) => {
    const action = existingSession
      ? updateSessionAction(existingSession.id, data)
      : createNewSessionAction(data);
    const response = await action;
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      if (useButton) {
        setHasChildrenOpen(false);
      } else {
        setOpen?.(false);
      }
      form.reset();
      startRefreshTransition(() => {
        router.refresh();
      });
      if (startAfterCreation) {
        // todo: navigate to start page
      }
    }
  };

  return (
    <>
      {useButton && (
        <Button
          {...buttonProps}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              setHasChildrenOpen(true);
            }
          }}
        >
          {buttonChildren}
        </Button>
      )}
      <Dialog
        open={useButton ? hasChildrenOpen : open}
        onOpenChange={useButton ? setHasChildrenOpen : setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {existingSession ? "Update session" : "New Session"}
            </DialogTitle>
            <DialogDescription>
              {existingSession
                ? "Adjust the details of your session."
                : "Configure a new session with the Oracle."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleSessionCreation)}
            className="flex flex-col gap-4 w-full"
          >
            <Controller
              control={form.control}
              name="title"
              render={({ field: { value, ...props }, fieldState }) => (
                <Field>
                  <FieldLabel>Title (Optional)</FieldLabel>
                  <FieldContent>
                    <Input
                      {...props}
                      value={value ?? ""}
                      placeholder="A memorable title for your session..."
                      className={getInputErrorStyle(fieldState.error)}
                    />
                  </FieldContent>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field: { value, ...props }, fieldState }) => (
                <Field>
                  <FieldLabel>Description (Optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...props}
                      value={value ?? ""}
                      placeholder="An optional description that explains the purpose of this session + other notes..."
                      className={cn(
                        "max-h-32",
                        getInputErrorStyle(fieldState.error),
                      )}
                    />
                  </FieldContent>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="programmingLanguage"
              render={({
                field: { value, onChange, ...props },
                fieldState,
              }) => (
                <Field>
                  <FieldLabel>Programming Language</FieldLabel>
                  <FieldContent>
                    <Select {...props} value={value} onValueChange={onChange}>
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
                  <FieldDescription>
                    The programming language that will be used during the
                    session.
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="numberOfProblems"
              control={form.control}
              render={({
                field: { value, onChange, ...props },
                fieldState,
              }) => (
                <Field>
                  <FieldLabel>Number of Problems</FieldLabel>
                  <FieldContent>
                    <Input
                      {...props}
                      type="number"
                      value={value === undefined ? "" : value}
                      onChange={(e) =>
                        onChange(
                          Number.isInteger(e.target.valueAsNumber)
                            ? e.target.valueAsNumber
                            : undefined,
                        )
                      }
                      placeholder="Number of problems in the session..."
                      className={getInputErrorStyle(fieldState.error)}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="mode"
              render={({
                field: { value, onChange, ...props },
                fieldState,
              }) => (
                <Field>
                  <FieldLabel>Mode</FieldLabel>
                  <FieldContent>
                    <Select {...props} value={value} onValueChange={onChange}>
                      <SelectTrigger
                        className={cn(
                          "w-full",
                          getInputErrorStyle(fieldState.error),
                        )}
                      >
                        <SelectValue placeholder="Select a mode..." />
                      </SelectTrigger>
                      <SelectContent>
                        {oracleSessionModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {formatOracleSessionMode(mode)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                  <FieldDescription>
                    The mode you select will control the Oracle&apos;s personality
                    during the session.
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="additionalInstructions"
              render={({ field: { value, ...props }, fieldState }) => (
                <Field>
                  <FieldLabel>Additional Instructions (Optional)</FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...props}
                      value={value ?? ""}
                      placeholder="I like hard problems, related to this specific topic. I learn best through examples and analogies, along with hands-on coding and building projects."
                      className={cn(
                        "max-h-32",
                        getInputErrorStyle(fieldState.error),
                      )}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Additional instructions or preferences that the Oracle
                    should know about you.
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {!existingSession && (
              <Field className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FieldContent className="flex-0">
                    <Checkbox
                      id="start_immediately_checkbox"
                      checked={startAfterCreation}
                      onCheckedChange={(checked) =>
                        setStartAfterCreation(
                          checked === "indeterminate" ? false : checked,
                        )
                      }
                    />
                  </FieldContent>
                  <FieldLabel
                    className="cursor-pointer"
                    htmlFor="start_immediately_checkbox"
                  >
                    Start immediately
                  </FieldLabel>
                </div>
                <FieldDescription>
                  Start the session immediately after it is created.
                </FieldDescription>
              </Field>
            )}
            <Button
              className="w-full"
              disabled={form.formState.isSubmitting || isRefreshing}
            >
              <LoadingSwap
                isLoading={form.formState.isSubmitting || isRefreshing}
              >
                {existingSession ? "Save changes" : "Create Session"}
              </LoadingSwap>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
