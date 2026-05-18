import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, varchar } from "drizzle-orm/pg-core";
import {
  programmingLanguageEnum,
  UserAvailabilityDayType,
  UserAvailabilityTimeOfDayType,
  userCollaborationStyleEnum,
  userExperienceLevelEnum,
  UserGoalType,
  userLookingForEnum,
  userMeetupPreferenceEnum,
} from "../shared";
import { user } from "./user";

export const UserProfileTable = pgTable("user_profiles", {
  userId: varchar("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .primaryKey(),
  preferredLanguage: programmingLanguageEnum("preferred_language").notNull(),
  bio: text("bio"),
  yearsProgramming: integer("years_programming"),
  experienceLevel: userExperienceLevelEnum("experience_level"),
  timezone: varchar("timezone"),
  location: varchar("location"),
  meetupPreference: userMeetupPreferenceEnum("meetup_preference"),
  collaborationStyle: userCollaborationStyleEnum("collaboration_style"),
  lookingFor: userLookingForEnum("looking_for"),
  availability: jsonb("availability").$type<{
    days?: UserAvailabilityDayType[];
    timeOfDay?: UserAvailabilityTimeOfDayType[];
    hoursPerWeek?: number;
  }>(),
  goals: jsonb("goals").$type<UserGoalType[]>(),
  githubUrl: varchar("github_url"),
  portfolioUrl: varchar("portfolio_url"),
  linkedinUrl: varchar("linkedin_url"),
});

export const userProfileRelations = relations(UserProfileTable, ({ one }) => ({
  user: one(user, {
    fields: [UserProfileTable.userId],
    references: [user.id],
  }),
}));
