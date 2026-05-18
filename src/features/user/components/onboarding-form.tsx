"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programmingLanguages, userExperienceLevels } from "@/db/shared";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { upsertUserSettingsAction } from "../actions/actions";
import { onboardingSchema, OnboardingSchemaType } from "../actions/schemas";
import {
  formatExperienceLevel,
  formatProgrammingLanguage,
} from "../lib/formatters";

export const OnboardingForm = () => {
  const router = useRouter();
  const form = useForm<OnboardingSchemaType>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferredLanguage: undefined,
      experienceLevel: undefined,
    },
  });

  const handleOnboarding = async (data: OnboardingSchemaType) => {
    const response = await upsertUserSettingsAction(data);
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleOnboarding)} className="space-y-4">
      <Controller
        name="preferredLanguage"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Preferred Programming Language</FieldLabel>
            <FieldContent>
              <Select {...props} value={value} onValueChange={onChange}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select a programming language..." />
                </SelectTrigger>
                <SelectContent>
                  {programmingLanguages.map((lang) => (
                    <SelectItem value={lang} key={lang}>
                      {formatProgrammingLanguage(lang)}
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
        name="experienceLevel"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Experience Level</FieldLabel>
            <FieldContent>
              <Select {...props} value={value} onValueChange={onChange}>
                <SelectTrigger
                  className={cn("w-full", getInputErrorStyle(fieldState.error))}
                >
                  <SelectValue placeholder="Select your experience level..." />
                </SelectTrigger>
                <SelectContent>
                  {userExperienceLevels.map((level) => (
                    <SelectItem value={level} key={level}>
                      {formatExperienceLevel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button className="w-full" disabled={form.formState.isSubmitting}>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          Continue
        </LoadingSwap>
      </Button>
    </form>
  );
};
