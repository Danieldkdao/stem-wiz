import { relations } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { programmingLanguageEnum } from "../shared";
import { user } from "./user";

export const UserSettingsTable = pgTable("user_settings", {
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .primaryKey(),
  preferredLanguage: programmingLanguageEnum("preferred_language").notNull(),
  additionalInformation: text("additional_information"),
});

export const userSettingRelations = relations(UserSettingsTable, ({ one }) => ({
  user: one(user, {
    fields: [UserSettingsTable.userId],
    references: [user.id],
  }),
}));
