import Link from "next/link";
import { Button } from "./ui/button";
import { ComponentProps } from "react";

export const LinkButton = ({
  href,
  children,
  asChild,
  ...props
}: { href: string } & ComponentProps<typeof Button>) => {
  return (
    <Button {...props} asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
};
