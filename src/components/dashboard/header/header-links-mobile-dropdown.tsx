import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import Link from "next/link";

export const HeaderLinksMobileDropdown = ({
  headerLinks,
}: {
  headerLinks: { displayText: string; href: string }[];
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="block md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="[&_svg:not([class*='size-'])]:size-6"
        >
          <MenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {headerLinks.map((link) => (
          <DropdownMenuItem asChild key={link.href}>
            <Link href={link.href} className="text-base font-medium">
              {link.displayText}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
