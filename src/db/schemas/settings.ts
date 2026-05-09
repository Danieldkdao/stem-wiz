import { pgEnum, pgTable, primaryKey, varchar } from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

export const preferredLanguages = [
  "python",
  "javascript",
  "java",
  "c++",
] as const;
export type PreferredLanguageType = (typeof preferredLanguages)[number];
export const preferredLanguageEnum = pgEnum(
  "preferred_languages",
  preferredLanguages,
);

export const SettingsTable = pgTable(
  "settings",
  {
    userId: varchar("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    preferredLanguage: preferredLanguageEnum("preferred_language").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId] })],
);

export const settingRelations = relations(SettingsTable, ({ one }) => ({
  user: one(user, {
    fields: [SettingsTable.userId],
    references: [user.id],
  }),
}));
