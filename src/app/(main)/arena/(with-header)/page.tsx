import { Card, CardContent } from "@/components/ui/card";
import { SwordsIcon, ViewIcon } from "lucide-react";
import Link from "next/link";

const options = [
  {
    title: "Compete",
    description: "We'll match you in a one-to-one battle to test your skills!",
    icon: SwordsIcon,
    href: "/arena/waiting",
  },
  {
    title: "Observe",
    description: "Watch others' matches to learn and see the action unfold!",
    icon: ViewIcon,
    href: "/arena/observe",
  },
];

const ArenaPage = () => {
  return (
    <div className="w-full h-full pt-10 px-6 flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-250 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold text-center">
            Welcome to the arena!
          </h1>
          <p className="text-base text-muted-foreground text-center">
            What do you want to do?
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center w-full">
          {options.map((option) => (
            <Link href={option.href} key={option.href} className="h-full">
              <Card className="h-full">
                <CardContent className="flex flex-col items-center gap-2">
                  <option.icon
                    className="text-primary size-20"
                    strokeWidth={3}
                  />
                  <h2 className="text-2xl mt-2 font-semibold text-center">
                    {option.title}
                  </h2>
                  <p className="text-muted-foreground text-base text-center">
                    {option.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArenaPage;
