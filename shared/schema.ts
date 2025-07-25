import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
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
  leetcodeId: integer("leetcode_id"),
  title: text("title").notNull(),
  titleSlug: text("title_slug"),
  difficulty: text("difficulty").notNull(), // Easy, Medium, Hard
  description: text("description").default(""),
  platform: text("platform").default("LeetCode"),
  tags: text("tags").array().default(sql`'{}'::text[]`),
  status: text("status").default("todo"), // todo, in-progress, completed, review
  submissionDate: text("submission_date"),
  userId: varchar("user_id").references(() => users.id),
  topicId: varchar("topic_id").references(() => topics.id),
  lastEdited: timestamp("last_edited").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const solutions = pgTable("solutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  problemId: varchar("problem_id").references(() => problems.id).notNull(),
  name: text("name").notNull().default("Solution 1"),
  approach: text("approach").default(""),
  timeComplexity: text("time_complexity").default("O()"),
  spaceComplexity: text("space_complexity").default("O()"),
  explanation: text("explanation").default(""),
  code: text("code").notNull(),
  language: text("language").notNull().default("cpp"),
  runtime: text("runtime"),
  memory: text("memory"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
});

export const insertProblemSchema = createInsertSchema(problems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastEdited: true,
});

export const insertSolutionSchema = createInsertSchema(solutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Problem = typeof problems.$inferSelect;
export type InsertProblem = z.infer<typeof insertProblemSchema>;
export type Solution = typeof solutions.$inferSelect;
export type InsertSolution = z.infer<typeof insertSolutionSchema>;
