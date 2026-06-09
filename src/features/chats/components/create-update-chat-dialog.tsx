import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChatTable } from "@/db/schema";
import { ReactNode } from "react";
import { CreateUpdateFriendChatForm } from "./create-update-friend-chat-form";

export const CreateUpdateFriendChatDialog = ({
  children,
  existingChat,
}: {
  children: ReactNode;
  existingChat?: typeof ChatTable.$inferSelect;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {existingChat ? "Update chat" : "Create new chat"}
          </DialogTitle>
          <DialogDescription className="text-base sr-only">
            {existingChat ? "Update an existing chat." : "Create a new chat."}
          </DialogDescription>
        </DialogHeader>
        <CreateUpdateFriendChatForm existingChat={existingChat} />
      </DialogContent>
    </Dialog>
  );
};
