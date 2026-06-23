"use client";

import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DayPickerProps } from "react-day-picker";

export function DatePickerTime({
  value,
  onValueChange,
  showLabels = true,
  inputClassName,
  ...props
}: {
  value: Date | undefined;
  onValueChange: (value: Date | undefined) => void;
  showLabels?: boolean;
  inputClassName?: string;
} & Omit<
    DayPickerProps,
    "mode" | "selected" | "onSelect" | "captionLayout" | "defaultMonth"
  >) {
  const [open, setOpen] = React.useState(false);
  const dateId = React.useId();
  const timeId = React.useId();
  const time = value ? format(value, "HH:mm:ss") : "";

  const mergeDateAndTime = React.useCallback(
    (nextDate: Date | undefined, nextTime: string) => {
      if (!nextDate) return undefined;

      const newDate = new Date(nextDate);
      if (nextTime) {
        const [hours, minutes, seconds = "0"] = nextTime.split(":");
        newDate.setHours(Number(hours), Number(minutes), Number(seconds), 0);
      }

      return newDate;
    },
    [],
  );

  return (
    <FieldGroup className="mx-auto w-full flex-row">
      <Field>
        {showLabels && (
          <FieldLabel htmlFor={dateId}>Date</FieldLabel>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={dateId}
              className={cn("w-32 justify-between font-normal", inputClassName)}
            >
              {value ? format(value, "PPP") : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              defaultMonth={value}
              onSelect={(date) => {
                const nextTime = time || format(new Date(), "HH:mm:ss");
                onValueChange(mergeDateAndTime(date, nextTime));
                setOpen(false);
              }}
              {...props}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        {showLabels && (
          <FieldLabel htmlFor={timeId}>Time</FieldLabel>
        )}
        <Input
          type="time"
          id={timeId}
          step="1"
          value={time}
          disabled={!value}
          className={cn(
            "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
            inputClassName,
          )}
          onChange={(e) => {
            onValueChange(mergeDateAndTime(value, e.target.value));
          }}
        />
      </Field>
    </FieldGroup>
  );
}
