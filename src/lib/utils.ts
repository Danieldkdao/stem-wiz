import { clsx, type ClassValue } from "clsx";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInputErrorStyle = (error?: FieldError) =>
  error ? "border-red-destructive" : undefined;

export const getTimeValues = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return { hours, minutes, seconds };
};

export const formatTime = (
  date?: Date | string | number | null | undefined,
) => {
  if (!date) return "Unknown";
  const d = new Date(date);

  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(d)
    .replace(/, (?=\d)/, " at ");

  return formatted;
};
