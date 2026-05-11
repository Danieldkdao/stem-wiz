"use client";

import { Controller, useForm } from "react-hook-form";
import { onboardingSchema, OnboardingSchemaType } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programmingLanguages } from "@/db/shared";
import { Textarea } from "@/components/ui/textarea";
import { cn, getInputErrorStyle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { upsertUserSettingsAction } from "../actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatPreferredLanguage } from "../lib/formatters";

export const OnboardingForm = () => {
  const router = useRouter();
  const form = useForm<OnboardingSchemaType>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      preferredLanguage: undefined,
      additionalInformation: undefined,
    },
  });

  const handleOnboardingCompletion = async (data: OnboardingSchemaType) => {
    const response = await upsertUserSettingsAction({
      ...data,
      additionalInformation: data.additionalInformation?.trim(),
    });
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      router.push("/dashboard");
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleOnboardingCompletion)}
      className="space-y-4"
    >
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
                      {formatPreferredLanguage(lang)}
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
        name="additionalInformation"
        control={form.control}
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field>
            <FieldLabel>Additional Information (optional)</FieldLabel>
            <FieldContent>
              <Textarea
                {...props}
                value={value ?? ""}
                onChange={(e) =>
                  onChange(e.target.value.trim() ? e.target.value : undefined)
                }
                placeholder="I like to learn through examples. I want to learn Python but I am most comfortable with Java."
                className={cn("max-h-32", getInputErrorStyle(fieldState.error))}
              />
            </FieldContent>
            <FieldDescription>
              Enter any additional preferences or information here that we can
              use to give you a better experience on our platform.
            </FieldDescription>
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
