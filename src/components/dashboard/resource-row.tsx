import Link from "next/link";
import { ReactNode } from "react";

export const ResourceRow = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="flex min-w-0 flex-col gap-3 border-b p-5 transition-colors last:border-b-0 hover:bg-muted/60 md:flex-row md:items-center md:justify-between"
    >
      {children}
    </Link>
  );
};
