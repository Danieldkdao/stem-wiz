"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChatTable } from "@/db/schema";
import { ReactNode, useState } from "react";
import { CreateUpdateFriendChatForm } from "./create-update-friend-chat-form";

export const CreateUpdateFriendChatDialog = ({
  children,
  existingChat,
}: {
  children: ReactNode;
  existingChat?: typeof ChatTable.$inferSelect;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <CreateUpdateFriendChatForm
          existingChat={existingChat}
          afterAction={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
