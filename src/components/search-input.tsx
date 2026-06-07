"use client";

import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useDebouncedCallback } from "@tanstack/react-pacer";

export const SearchInput = ({
  initialSearch,
  onValueChange,
  placeholder,
}: {
  initialSearch: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [search, setSearch] = useState(initialSearch);

  const debouncedOnValueChange = useDebouncedCallback(onValueChange, {
    wait: 300,
  });

  return (
    <div
      className={cn(
        "flex items-center gap-2 border rounded-md bg-card dark:bg-input/30 py-2 px-4 w-full",
      )}
    >
      <SearchIcon />
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          debouncedOnValueChange(e.target.value);
        }}
        placeholder={placeholder}
        className="border-none ring-0 outline-0 focus-visible:ring-0 focus-visible:outline-0 bg-transparent dark:bg-transparent shadow-none text-lg md:text-lg"
      />
    </div>
  );
};
