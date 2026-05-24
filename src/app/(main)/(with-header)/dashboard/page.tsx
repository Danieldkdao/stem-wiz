import { Card, CardContent } from "@/components/ui/card";
import { LandmarkIcon, SparklesIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

const options = [
  {
    title: "Arena",
    description:
      "Ready to face off against other developers to learn and improve your skills? Go to arena to get started!",
    icon: LandmarkIcon,
    href: "/arena",
  },
  {
    title: "Community",
    description:
      "Need a teammate for a hackathon or want to find some coding pals? Discover other developers and groups to collaborate and have fun.",
    icon: UsersIcon,
    href: "/community",
  },
  {
    title: "The Oracle",
    description:
      "Feeling shaky on some concepts? Head to the oracle to get personalized traning and feedback to improve your skills.",
    icon: SparklesIcon,
    href: "/oracle/sessions",
  },
];

const DashboardPage = () => {
  return (
    <div className="w-full h-full pt-10 px-6 flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-250 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold text-center">
            Good to see you again!
          </h1>
          <p className="text-base text-muted-foreground text-center">
            What are you feeling like today?
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center w-full">
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

export default DashboardPage;
