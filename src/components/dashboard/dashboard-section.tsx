import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import Link from "next/link";

export const DashboardSection = ({
  icon: Icon,
  title,
  href,
  children,
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
  children: ReactNode;
}) => {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-5">
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="size-6 shrink-0 text-primary" />
          <CardTitle className="min-w-0 flex-1 truncate font-semibold text-2xl">
            {title}
          </CardTitle>
          {href && (
            <Button variant="link" size="sm" asChild>
              <Link href={href}>View all</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
};
