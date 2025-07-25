import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  leetcodeUsername: text("leetcode_username"),
  totalSolved: integer("total_solved").default(0),
  easySolved: integer("easy_solved").default(0),
  mediumSolved: integer("medium_solved").default(0),
  hardSolved: integer("hard_solved").default(0),
  lastFetchedAt: text("last_fetched_at"),
});

export const topics = pgTable("topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("blue"),
  icon: text("icon"),
  isCustom: integer("is_custom").default(0),
  userId: varchar("user_id").references(() => users.id),
});

export const problems = pgTable("problems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leetcodeId: integer("leetcode_id").notNull(),
  title: text("title").notNull(),
  titleSlug: text("title_slug").notNull(),
  difficulty: text("difficulty").notNull(), // Easy, Medium, Hard
  tags: text("tags").array(),
  description: text("description"),
  submissionDate: text("submission_date"),
  language: text("language"),
  code: text("code"),
  runtime: text("runtime"),
  memory: text("memory"),
  userId: varchar("user_id").references(() => users.id),
  topicId: varchar("topic_id").references(() => topics.id),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
