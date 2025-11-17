import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const races = mysqlTable("races", {
  id: int("id").autoincrement().primaryKey(),
  raceId: varchar("raceId", { length: 255 }).notNull().unique(),
  date: timestamp("date").notNull(),
  track: varchar("track", { length: 255 }).notNull(),
  raceNumber: int("raceNumber").notNull(),
  raceType: varchar("raceType", { length: 100 }),
  distance: int("distance"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Race = typeof races.$inferSelect;

export const horses = mysqlTable("horses", {
  id: int("id").autoincrement().primaryKey(),
  horseName: varchar("horseName", { length: 255 }).notNull(),
  raceId: int("raceId").notNull(),
  jockey: varchar("jockey", { length: 255 }),
  trainer: varchar("trainer", { length: 255 }),
  odds: varchar("odds", { length: 50 }),
  form: text("form"),
});

export type Horse = typeof horses.$inferSelect;

/**
 * Enhanced predictions table - stores detailed model predictions for each race
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  raceId: int("raceId").notNull(),
  predictions: text("predictions").notNull(),
  modelVersion: varchar("modelVersion", { length: 50 }).default("1.0").notNull(),
  // Top 4 predictions
  horse1st: varchar("horse1st", { length: 255 }),
  horse2nd: varchar("horse2nd", { length: 255 }),
  horse3rd: varchar("horse3rd", { length: 255 }),
  horse4th: varchar("horse4th", { length: 255 }),
  // Confidence scores
  confidence1st: decimal("confidence1st", { precision: 5, scale: 4 }),
  confidence2nd: decimal("confidence2nd", { precision: 5, scale: 4 }),
  confidence3rd: decimal("confidence3rd", { precision: 5, scale: 4 }),
  confidence4th: decimal("confidence4th", { precision: 5, scale: 4 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * Race results table - stores actual race outcomes for accuracy tracking
 */
export const raceResults = mysqlTable("raceResults", {
  id: int("id").autoincrement().primaryKey(),
  raceId: varchar("raceId", { length: 255 }).notNull().unique(),
  raceName: varchar("raceName", { length: 255 }).notNull(),
  trackName: varchar("trackName", { length: 128 }).notNull(),
  raceDate: timestamp("raceDate").notNull(),
  // Actual finishing order
  winner: varchar("winner", { length: 255 }).notNull(),
  second: varchar("second", { length: 255 }).notNull(),
  third: varchar("third", { length: 255 }).notNull(),
  fourth: varchar("fourth", { length: 255 }).notNull(),
  // Odds at time of result
  winningOdds: decimal("winningOdds", { precision: 8, scale: 2 }),
  secondOdds: decimal("secondOdds", { precision: 8, scale: 2 }),
  thirdOdds: decimal("thirdOdds", { precision: 8, scale: 2 }),
  fourthOdds: decimal("fourthOdds", { precision: 8, scale: 2 }),
  trackCondition: varchar("trackCondition", { length: 64 }),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RaceResult = typeof raceResults.$inferSelect;
export type InsertRaceResult = typeof raceResults.$inferInsert;

/**
 * Accuracy metrics table - aggregated performance metrics per user/model
 */
export const accuracyMetrics = mysqlTable("accuracyMetrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
  // Prediction counts
  totalPredictions: int("totalPredictions").notNull(),
  // Accuracy metrics
  top1Accuracy: decimal("top1Accuracy", { precision: 5, scale: 4 }).notNull(),
  top3HitRate: decimal("top3HitRate", { precision: 5, scale: 4 }).notNull(),
  top4HitRate: decimal("top4HitRate", { precision: 5, scale: 4 }).notNull(),
  // Financial metrics
  roi: decimal("roi", { precision: 8, scale: 4 }).notNull(),
  totalStaked: decimal("totalStaked", { precision: 12, scale: 2 }).notNull(),
  totalReturns: decimal("totalReturns", { precision: 12, scale: 2 }).notNull(),
  // Model quality metrics
  calibrationScore: decimal("calibrationScore", { precision: 5, scale: 4 }).notNull(),
  marketBeatRate: decimal("marketBeatRate", { precision: 5, scale: 4 }).notNull(),
  ndcg4: decimal("ndcg4", { precision: 5, scale: 4 }).notNull(),
  averageConfidence: decimal("averageConfidence", { precision: 5, scale: 4 }).notNull(),
  // Period
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccuracyMetric = typeof accuracyMetrics.$inferSelect;
export type InsertAccuracyMetric = typeof accuracyMetrics.$inferInsert;
