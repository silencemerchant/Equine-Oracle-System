import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, apiKeys, apiUsage, billingRecords, type Subscription, type InsertSubscription, type ApiKey, type InsertApiKey, type ApiUsage, type InsertApiUsage, type BillingRecord, type InsertBillingRecord } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Subscription management
 */
export async function createSubscription(data: InsertSubscription): Promise<Subscription> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(subscriptions).values(data);
  const id = result[0]?.insertId || 0;
  
  const created = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return created[0];
}

export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubscriptionByStripeCustomerId(customerId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(id: number, data: Partial<InsertSubscription>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(subscriptions).set(data).where(eq(subscriptions.id, id));
}

/**
 * API key management
 */
export async function createApiKey(data: InsertApiKey): Promise<ApiKey> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(apiKeys).values(data);
  const id = result[0]?.insertId || 0;
  
  const created = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  return created[0];
}

export async function getApiKeysByUserId(userId: number): Promise<ApiKey[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(apiKeys).where(and(eq(apiKeys.userId, userId)));
}

export async function validateApiKey(key: string): Promise<ApiKey | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(apiKeys).where(and(eq(apiKeys.key, key))).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function revokeApiKey(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id));
}

/**
 * API usage tracking
 */
export async function logApiUsage(data: InsertApiUsage): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(apiUsage).values(data);
  } catch (error) {
    console.error("[Database] Failed to log API usage:", error);
  }
}

export async function getApiUsageStats(userId: number, days: number = 30): Promise<{ total: number; byEndpoint: Record<string, number> }> {
  const db = await getDb();
  if (!db) return { total: 0, byEndpoint: {} };

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const results = await db.select().from(apiUsage).where(and(eq(apiUsage.userId, userId)));

  const byEndpoint: Record<string, number> = {};
  let total = 0;

  results.forEach(record => {
    if (record.createdAt && record.createdAt > cutoff) {
      total++;
      byEndpoint[record.endpoint] = (byEndpoint[record.endpoint] || 0) + 1;
    }
  });

  return { total, byEndpoint };
}

/**
 * Billing records
 */
export async function createBillingRecord(data: InsertBillingRecord): Promise<BillingRecord> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(billingRecords).values(data);
  const id = result[0]?.insertId || 0;
  
  const created = await db.select().from(billingRecords).where(eq(billingRecords.id, id)).limit(1);
  return created[0];
}

export async function getBillingRecordsByUserId(userId: number): Promise<BillingRecord[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(billingRecords).where(eq(billingRecords.userId, userId));
}
