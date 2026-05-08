"use client";

import { ComponentProps, useMemo, useState } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { SearchOption } from "@/lib/types";
import { SEARCH_OPTION_ICONS } from "@/lib/constants";
import { SearchXIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type SearchOptionsInputProps = {
  options: SearchOption[];
  bottomValue?: string;
  topValue?: string;
};

const getWrappedIndex = (
  currentIndex: number,
  offset: number,
  length: number,
) => (currentIndex + offset + length) % length;

// todo: fix the bug that occurs when you return from this page using the back button after you got redirected from a link in the options and the options no longer show up until you refresh the page

export const SearchOptionsInput = ({
  options,
  bottomValue = "bottom-16",
  topValue = undefined,
  ...props
}: SearchOptionsInputProps & ComponentProps<typeof Input>) => {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [focusedOption, setFocusedOption] = useState<
    (typeof options)[number]["label"] | null
  >(null);
  const optionsShowing = Boolean(value.trim());

  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.label.toLowerCase().includes(value.trim().toLowerCase()),
    );
  }, [options, value]);
  const hasFocusedOption = filteredOptions.some(
    (option) => option.label === focusedOption,
  )
    ? focusedOption
    : null;
  const currentFocusedOption =
    filteredOptions.find((option) => option.label === focusedOption) ?? null;

  const focusOptionByOffset = (offset: 1 | -1) => {
    if (!filteredOptions.length) return;

    const currentOptionIndex = filteredOptions.findIndex(
      (option) => option.label === hasFocusedOption,
    );
    const fallbackIndex = offset > 0 ? -1 : 0;
    const nextOptionIndex = getWrappedIndex(
      currentOptionIndex >= 0 ? currentOptionIndex : fallbackIndex,
      offset,
      filteredOptions.length,
    );

    setFocusedOption(filteredOptions[nextOptionIndex].label);
  };

  return (
    <div className="w-full relative">
      <div
        className={cn(
          "absolute right-0 left-0 bg-card rounded-md border p-4 opacity-0 transition-opacity duration-300 pointer-events-none flex flex-col gap-2",
          topValue ?? bottomValue,
          optionsShowing && "opacity-100 pointer-events-auto",
        )}
      >
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const isFocusedOption = option.label === hasFocusedOption;
            const Icon = SEARCH_OPTION_ICONS[option.icon];
            return (
              <div
                key={option.label}
                className={cn(
                  "w-full bg-card/80 rounded-md p-2 flex items-center gap-2 transition-colors duration-300 cursor-pointer hover:bg-accent/50",
                  isFocusedOption && "bg-accent/50",
                )}
                onClick={() => {
                  setValue("");
                  router.push(option.href);
                }}
              >
                <Icon />
                {option.label}
              </div>
            );
          })
        ) : (
          <div className="py-6 flex flex-col items-center justify-center w-full">
            <SearchXIcon />
            <h2 className="text-lg font-medium text-center">404 Not Found</h2>
            <p className="text-sm text-muted-foreground text-center">
              No results were found for &quot;{value}&quot;. Try adjusting your
              search.
            </p>
          </div>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => {
          const nextValue = e.target.value;
          setValue(nextValue);
          if (!nextValue.trim()) {
            setFocusedOption(null);
          }
        }}
        onKeyDown={(e) => {
          if (!optionsShowing || !filteredOptions.length) return;

          if (e.key === "Enter" && currentFocusedOption) {
            router.push(currentFocusedOption.href);
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            focusOptionByOffset(-1);
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            focusOptionByOffset(1);
          }
        }}
        {...props}
      />
    </div>
  );
};
