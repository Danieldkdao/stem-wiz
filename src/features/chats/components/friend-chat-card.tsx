import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { ChatTable } from "@/db/schema";
import { User } from "@/lib/auth/auth";
import { formatTime } from "@/lib/utils";
import { MessageSquareMoreIcon } from "lucide-react";
import Link from "next/link";

export const FriendChatCard = ({
  chat,
}: {
  chat: typeof ChatTable.$inferSelect & { messageCount: number; user: User };
}) => {
  return (
    <Link href={`/community/chats/${chat.id}`} className="w-full h-full">
      <Card className="w-full h-full">
        <CardContent className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold truncate">{chat.title}</h2>
          <p className="text-muted-foreground text-base">
            Created {formatTime(chat.createdAt)}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-base">with</p>
            <div className="flex items-center gap-2">
              <UserAvatar
                {...chat.user}
                className="size-6"
                textClassName="text-sm"
              />
              <span className="text-base font-medium">{chat.user.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquareMoreIcon className="text-muted-foreground size-5" />
            <span className="text-muted-foreground text-base">
              {chat.messageCount}{" "}
              {chat.messageCount === 1 ? "message" : "messages"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
