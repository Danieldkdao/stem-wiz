import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { CommunityProblemTable } from "./community-problem";
import { FriendshipTable } from "./friendship";

export const CommunityProblemInvitationTable = pgTable(
  "community_problem_invitations",
  {
    id,
    friendshipId: uuid("friendship_id")
      .references(() => FriendshipTable.id, { onDelete: "cascade" })
      .notNull(),
    communityProblemId: uuid("community_problem_id")
      .references(() => CommunityProblemTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt,
    updatedAt,
  },
);

export const communityProblemInvitations = relations(
  CommunityProblemInvitationTable,
  ({ one }) => ({
    friendship: one(FriendshipTable, {
      fields: [CommunityProblemInvitationTable.friendshipId],
      references: [FriendshipTable.id],
    }),
    communityProblem: one(CommunityProblemTable, {
      fields: [CommunityProblemInvitationTable.communityProblemId],
      references: [CommunityProblemTable.id],
    }),
  }),
);
