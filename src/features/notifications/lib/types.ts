export type NotificationServerMessage =
  | {
      type: "received_friend_request";
      friendRequestId: string;
    }
  | {
      type: "accepted_friend_request";
      friendRequestId: string;
    }
  | {
      type: "error";
      message: string;
    };
