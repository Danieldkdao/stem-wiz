import { SearchIcon } from "lucide-react";
import { getUsersAction } from "../actions/actions";
import { CommunityUserCard } from "./community-user-card";

export const CommunityView = async () => {
  const users = await getUsersAction();

  return (
    <div className="mx-auto w-full max-w-250 grid grid-cols-1 gap-4">
      {users.length ? (
        users.map((user) => <CommunityUserCard key={user.id} user={user} />)
      ) : (
        <div className="w-full rounded-md border-4 border-dashed bg-card p-5 sm:p-10 flex items-center justify-center gap-2">
          <SearchIcon className="size-10" />
          <h1 className="text-center text-3xl font-semibold">No users found</h1>
          <p className="text-muted-foreground text-center">
            We couldn't find any users at this moment. Try adjusting your search
            terms or reloading the page.
          </p>
        </div>
      )}
    </div>
  );
};
