import { CodeIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { LinkButton } from "../link-button";
import { FaGithub } from "react-icons/fa6";
import { TooltipWrapper } from "../tooltip-wrapper";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";
import { Skeleton } from "../ui/skeleton";

export const Header = () => {
  return (
    <nav className="w-full p-4 bg-card border-b">
      <div className="flex items-center gap-2 mx-auto w-full max-w-7xl justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <CodeIcon className="text-primary" />
              <span className="text-xl font-semibold text-primary">
                Synapse
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TooltipWrapper content="View source code" side="bottom">
            <LinkButton
              href="https://github.com/Danieldkdao/synapse"
              variant="ghost"
              size="icon"
              className="[&_svg:not([class*='size-'])]:size-6"
            >
              <FaGithub />
            </LinkButton>
          </TooltipWrapper>
          <Suspense fallback={<Skeleton className="h-9 w-32 rounded-md" />}>
            <HeaderSuspense />
          </Suspense>
        </div>
      </div>
    </nav>
  );
};

const HeaderSuspense = async () => {
  const { userId } = await getCurrentUser();

  return userId ? (
    <LinkButton href="/dashboard">Go to dashboard</LinkButton>
  ) : (
    <div className="flex items-center gap-2">
      <LinkButton variant="outline" href="/sign-in">
        Sign in
      </LinkButton>
      <LinkButton href="/sign-up">Sign up</LinkButton>
    </div>
  );
};
