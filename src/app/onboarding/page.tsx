import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OnboardingForm } from "@/features/user/components/onboarding-form";

const OnboardingPage = () => {
  return (
    <div className="bg-radial w-full h-svh from-primary/10 via-primary/20 to-primary/10 py-10 px-6 flex items-center justify-center">
      <div className="w-full max-w-150">
        <Card>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-center">Onboarding</h1>
              <p className="text-muted-foreground">
                Help us get to know you and your interests!
              </p>
            </div>
            <Separator />
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
