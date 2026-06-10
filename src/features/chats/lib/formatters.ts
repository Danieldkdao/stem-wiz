import { ChatMessageStatusType } from "@/db/shared";

export const formatChatMessageStatus = (status: ChatMessageStatusType) => {
  switch (status) {
    case "created":
      return "Created";
    case "deleted":
      return "Deleted";
    case "updated":
      return "Edited";
  }
};
