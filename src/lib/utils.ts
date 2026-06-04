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

export const getDuration = (
  start?: Date | null | undefined | string | number,
  end?: Date | null | undefined | string | number,
) => {
  if (!start || !end) return "Unknown";

  const startDate = new Date(start);
  const endDate = new Date(end);

  const totalSeconds = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / 1000),
  );
  const { hours, minutes, seconds } = getTimeValues(totalSeconds);

  if (hours === 0 && minutes === 0) return `${seconds} sec`;

  const parts: string[] = [];

  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds) parts.push(`${seconds} sec`);

  return parts.join(" ");
};
