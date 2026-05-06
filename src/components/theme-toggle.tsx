"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const themes = [
  {
    label: "Light",
    value: "light",
    icon: SunIcon,
  },
  {
    label: "Dark",
    value: "dark",
    icon: MoonIcon,
  },
  {
    label: "System",
    value: "system",
    icon: LaptopIcon,
  },
];

export const ThemeToggle = ({ className }: { className?: string }) => {
  const [isPending, setIsPending] = useState(true);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setIsPending(false);
  }, []);

  if (isPending) return null;

  const activeTheme = theme === "system" ? "system" : (resolvedTheme ?? theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("cursor-pointer", className)} asChild>
        <Button variant="outline" size="icon">
          {activeTheme === "light" ? (
            <SunIcon className="size-5" />
          ) : activeTheme === "dark" ? (
            <MoonIcon className="size-5" />
          ) : (
            <LaptopIcon className="size-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setTheme(theme.value)}
            className="flex items-center gap-2"
          >
            <theme.icon />
            <label className="font-medium">{theme.label}</label>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
