import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { tabsListVariants, tabsTriggerClassName } from "./ui/tabs";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type TabLinkOption = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

type TabLinkProps = {
  options: TabLinkOption[];
  ariaLabel: string;
  className?: string;
};

export const TabLinks = ({ options, ariaLabel, className }: TabLinkProps) => {
  const pathname = usePathname();
  const currentPathname = pathname ?? "";

  return (
    <nav
      aria-label={ariaLabel}
      data-orientation="horizontal"
      className="group/tabs flex w-full data-
        horizontal:flex-col"
    >
      <div
        data-slot="tabs-list"
        data-variant="default"
        className={cn(tabsListVariants(), "w-full bg-background/30", className)}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.exact
            ? currentPathname === option.href
            : currentPathname === option.href ||
              currentPathname.startsWith(`${option.href}/`);

          return (
            <Link
              key={option.href}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive ? true : undefined}
              className={tabsTriggerClassName}
            >
              <Icon />
              {option.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
