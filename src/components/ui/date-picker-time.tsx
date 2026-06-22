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
  mode,
  selected,
  captionLayout,
  defaultMonth,
  onSelect,
  ...props
}: {
  value: Date | undefined;
  onValueChange: (value: Date | undefined) => void;
  showLabels?: boolean;
  inputClassName?: string;
} & DayPickerProps & {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
  }) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [time, setTime] = React.useState<string | undefined>(undefined);

  const handleOnValueChange = () => {
    if (time) {
      const newDate = date;
      const [hours, minutes, seconds] = time.split(":");
      newDate?.setHours(Number(hours), Number(minutes), Number(seconds));

      onValueChange(newDate);
    } else {
      onValueChange(date);
    }
  };

  return (
    <FieldGroup className="mx-auto w-full flex-row">
      <Field>
        {showLabels && (
          <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className={cn("w-32 justify-between font-normal", inputClassName)}
            >
              {date ? format(date, "PPP") : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(date) => {
                setDate(date);
                handleOnValueChange();
                setOpen(false);
              }}
              {...props}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        {showLabels && (
          <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        )}
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          value={time ?? ""}
          className={cn(
            "appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
            inputClassName,
          )}
          onChange={(e) => {
            setTime(e.target.value);
            handleOnValueChange();
          }}
        />
      </Field>
    </FieldGroup>
  );
}
