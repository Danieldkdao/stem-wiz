import { clsx, type ClassValue } from "clsx";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { DeepKeys } from "./types";
import z from "zod";
import { MAX_CONCEPTS_BEFORE_SHORTENING } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInputErrorStyle = (error?: FieldError) =>
  error ? "border-red-destructive" : undefined;

// Example: getTimeValues(3665) returns { hours: 1, minutes: 1, seconds: 5 }.
export const getTimeValues = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return { hours, minutes, seconds };
};

// Example: formatTime(date) returns "Oct 20, 2026 at 4:30 PM".
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

// Example: getDuration(start, end) returns "1 hr 12 min 5 sec".
export const getDuration = (
  start?: Date | null | undefined | string | number,
  end?: Date | null | undefined | string | number,
  initialTotalSeconds?: number | null,
) => {
  let totalSeconds: number | null = null;
  if (initialTotalSeconds) {
    totalSeconds = initialTotalSeconds;
  } else {
    if (!start || !end) return "Unknown";
    const startDate = new Date(start);
    const endDate = new Date(end);

    totalSeconds = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / 1000),
    );
  }

  if (!totalSeconds) return "Unknown";

  const { hours, minutes, seconds } = getTimeValues(totalSeconds);

  if (hours === 0 && minutes === 0) return `${seconds} sec`;

  const parts: string[] = [];

  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  if (seconds) parts.push(`${seconds} sec`);

  return parts.join(" ");
};

// returns => Oct 20, 2026
export const formatShortDate = (date: Date | string | number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value != null && !Array.isArray(value);
};

export const changeObjectValues = <T>(
  value: T,
  fieldNames: DeepKeys<T>[],
  changeFunction: (arg: unknown) => unknown,
): T => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      changeObjectValues(item, fieldNames, changeFunction),
    ) as T;
  }
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, value]) => {
      if (fieldNames.includes(key as DeepKeys<T>)) {
        return [key, changeFunction(value)];
      }
      return [
        key,
        changeObjectValues<T>(value as T, fieldNames, changeFunction),
      ];
    }),
  ) as T;
};

export const areValidIds = (ids: string[]) => {
  const idSchema = z.uuid();

  const results: boolean[] = [];
  ids.forEach((id) => {
    results.push(idSchema.safeParse(id).success);
  });

  return results.every(Boolean);
};

export const getShortenedConcepts = (
  concepts: string[],
): { concept: string; variant: "outline" | "secondary" }[] => {
  const difference = concepts.length - MAX_CONCEPTS_BEFORE_SHORTENING;
  if (difference <= 0)
    return concepts.map((concept) => ({
      concept,
      variant: "outline" as const,
    }));
  const mappedArray: { concept: string; variant: "outline" | "secondary" }[] =
    concepts
      .slice(0, MAX_CONCEPTS_BEFORE_SHORTENING)
      .map((concept) => ({ concept, variant: "outline" as const }));
  mappedArray.push({
    concept: `+${difference}`,
    variant: "secondary" as const,
  });
  return mappedArray;
};
