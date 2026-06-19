import { CommunityAiDiscoverForm } from "@/features/social/components/community-ai-discover-form";

const CommunityAiDiscoverPage = () => {
  return (
    <div className="flex-1 flex flex-col items-center gap-10 justify-center mt-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-center text-4xl font-semibold">AI Discover</h1>
        <p className="text-center text-muted-foreground text-lg max-w-150">
          Discover other users with similar interests using AI. Include the
          information in the prompt and our AI will find users that fit what
          your are looking for. The more detailed you are, the better the
          recommendations will be.
        </p>
      </div>

      <CommunityAiDiscoverForm />
    </div>
  );
};

export default CommunityAiDiscoverPage;
