"use client";

import { ComponentProps, KeyboardEvent, useState } from "react";
import { Input } from "./ui/input";

export const ControlledInput = ({
  value,
  onChange,
  onKeyDown,
  ...props
}: {
  onKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    setValue: (value: string) => void,
  ) => void;
} & Omit<ComponentProps<typeof Input>, "onKeyDown">) => {
  const [inputValue, setInputValue] = useState("");

  return (
    <Input
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={(e) => onKeyDown(e, inputValue, setInputValue)}
      {...props}
    />
  );
};
