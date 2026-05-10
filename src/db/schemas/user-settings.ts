import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const preferredLanguages = [
  "python",
  "javascript",
  "java",
  "c++",
  "typescript",
] as const;
export type PreferredLanguageType = (typeof preferredLanguages)[number];
export const preferredLanguageEnum = pgEnum(
  "preferred_languages",
  preferredLanguages,
);

export const UserSettingsTable = pgTable(
  "user_settings",
  {
    userId: varchar("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    preferredLanguage: preferredLanguageEnum("preferred_language").notNull(),
    additionalInformation: text("additional_information"),
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const userSettingRelations = relations(UserSettingsTable, ({ one }) => ({
  user: one(user, {
    fields: [UserSettingsTable.userId],
    references: [user.id],
  }),
}));
