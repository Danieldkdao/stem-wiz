import { Input } from "@/components/ui/input";
import { CommunityView } from "@/features/user/components/community-view";

const CommunityPage = () => {
  return (
    <div className="flex flex-col items-center gap-8 h-full overflow-y-auto w-full pb-20 pt-20 md:pt-40 px-10">
      <h1 className="text-4xl md:text-6xl font-bold text-center">
        Explore our community of developers
      </h1>
      <Input
        className="text-3xl md:text-4xl shrink-0 max-w-200 rounded-full h-14 border bg-accent-foreground md:h-18 px-6 md:px-8"
        placeholder="Search for developers..."
      />
      <CommunityView />
    </div>
  );
};

export default CommunityPage;
