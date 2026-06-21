"use client";

import { ComponentProps } from "react";
import { Button } from "./ui/button";

export const RefreshPageButton = ({
  children,
  onClick,
  ...props
}: ComponentProps<typeof Button>) => {
  return (
    <Button
      onClick={() => {
        window.location.reload();
      }}
      {...props}
    >
      {children}
    </Button>
  );
};
