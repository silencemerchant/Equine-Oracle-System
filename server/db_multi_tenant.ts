/**
 * Multi-tenant database helper functions
 * Supports LOWKEY CONSULTANTS client management
 */

import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import {
  clients,
  clientConfigs,
  clientUsage,
  deployments,
  clientBilling,
  serviceContracts,
  clientTeamMembers,
  supportTickets,
  auditLog,
  lowkeyCompanyInfo,
  type InsertClient,
  type InsertClientConfig,
  type InsertClientUsage,
  type InsertDeployment,
  type InsertClientBilling,
  type InsertServiceContract,
  type InsertSupportTicket,
  type InsertAuditLogEntry,
} from '../drizzle/multi_tenant_schema';
import { getDb } from './db';

/**
 * CLIENT MANAGEMENT
 */

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(clients).values(data);
    return result;
  } catch (error) {
    console.error('Failed to create client:', error);
    throw error;
  }
}

export async function getClientByLicenseKey(licenseKey: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.licenseKey, licenseKey))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to get client:', error);
    return null;
  }
}

export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to get client by ID:', error);
    return null;
  }
}

export async function updateClientStatus(clientId: number, status: 'active' | 'suspended' | 'inactive') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    await db
      .update(clients)
      .set({ status })
      .where(eq(clients.id, clientId));
  } catch (error) {
    console.error('Failed to update client status:', error);
    throw error;
  }
}

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(clients);
  } catch (error) {
    console.error('Failed to get all clients:', error);
    return [];
  }
}

/**
 * CLIENT CONFIGURATION
 */

export async function setClientConfig(clientId: number, key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Check if config exists
    const existing = await db
      .select()
      .from(clientConfigs)
      .where(and(eq(clientConfigs.clientId, clientId), eq(clientConfigs.configKey, key)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(clientConfigs)
        .set({ configValue: value })
        .where(and(eq(clientConfigs.clientId, clientId), eq(clientConfigs.configKey, key)));
    } else {
      // Insert new
      await db.insert(clientConfigs).values({
        clientId,
        configKey: key,
        configValue: value,
      });
    }
  } catch (error) {
    console.error('Failed to set client config:', error);
    throw error;
  }
}

export async function getClientConfig(clientId: number, key: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(clientConfigs)
      .where(and(eq(clientConfigs.clientId, clientId), eq(clientConfigs.configKey, key)))
      .limit(1);

    return result.length > 0 ? result[0].configValue : null;
  } catch (error) {
    console.error('Failed to get client config:', error);
    return null;
  }
}

export async function getAllClientConfigs(clientId: number) {
  const db = await getDb();
  if (!db) return {};

  try {
    const configs = await db
      .select()
      .from(clientConfigs)
      .where(eq(clientConfigs.clientId, clientId));

    const result: Record<string, string> = {};
    configs.forEach(config => {
      if (config.configValue) {
        result[config.configKey] = config.configValue;
      }
    });
    return result;
  } catch (error) {
    console.error('Failed to get all client configs:', error);
    return {};
  }
}

/**
 * USAGE TRACKING
 */

export async function recordUsage(clientId: number, metricName: string, value: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    await db.insert(clientUsage).values({
      clientId,
      metricName,
      metricValue: value,
    });
  } catch (error) {
    console.error('Failed to record usage:', error);
    throw error;
  }
}

export async function getClientUsage(clientId: number, metricName: string, hoursAgo: number = 24) {
  const db = await getDb();
  if (!db) return [];

  try {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const result = await db
      .select()
      .from(clientUsage)
      .where(
        and(
          eq(clientUsage.clientId, clientId),
          eq(clientUsage.metricName, metricName),
          // Note: Drizzle doesn't have a direct gte operator, so we filter in application
        )
      );

    return result.filter(r => new Date(r.recordedAt) > cutoffTime);
  } catch (error) {
    console.error('Failed to get client usage:', error);
    return [];
  }
}

/**
 * DEPLOYMENTS
 */

export async function createDeployment(data: InsertDeployment) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const result = await db.insert(deployments).values(data);
    return result;
  } catch (error) {
    console.error('Failed to create deployment:', error);
    throw error;
  }
}

export async function getClientDeployments(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(deployments)
      .where(eq(deployments.clientId, clientId));
  } catch (error) {
    console.error('Failed to get client deployments:', error);
    return [];
  }
}

export async function updateDeploymentStatus(deploymentId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    await db
      .update(deployments)
      .set({ status: status as any })
      .where(eq(deployments.id, deploymentId));
  } catch (error) {
    console.error('Failed to update deployment status:', error);
    throw error;
  }
}

/**
 * BILLING
 */

export async function createBillingRecord(data: InsertClientBilling) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    await db.insert(clientBilling).values(data);
  } catch (error) {
    console.error('Failed to create billing record:', error);
    throw error;
  }
}

export async function getClientBillingHistory(clientId: number, limit: number = 12) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(clientBilling)
      .where(eq(clientBilling.clientId, clientId))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get billing history:', error);
    return [];
  }
}

/**
 * AUDIT LOGGING
 */

export async function logAuditEvent(data: InsertAuditLogEntry) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    await db.insert(auditLog).values(data);
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging shouldn't break operations
  }
}

export async function getClientAuditLog(clientId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.clientId, clientId))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get audit log:', error);
    return [];
  }
}

/**
 * LOWKEY COMPANY INFO
 */

export async function getLowkeyCompanyInfo() {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(lowkeyCompanyInfo)
      .where(eq(lowkeyCompanyInfo.id, 1))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to get LOWKEY company info:', error);
    return null;
  }
}

export async function updateLowkeyCompanyInfo(data: Partial<typeof lowkeyCompanyInfo.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    const existing = await db
      .select()
      .from(lowkeyCompanyInfo)
      .where(eq(lowkeyCompanyInfo.id, 1))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(lowkeyCompanyInfo)
        .set(data)
        .where(eq(lowkeyCompanyInfo.id, 1));
    } else {
      await db.insert(lowkeyCompanyInfo).values({
        id: 1,
        companyName: data.companyName || '',
        companyNumber: data.companyNumber || '',
        entityType: data.entityType || '',
        status: data.status || 'pending',
        ...data,
      } as any);
    }
  } catch (error) {
    console.error('Failed to update LOWKEY company info:', error);
    throw error;
  }
}

/**
 * LICENSE KEY GENERATION
 */

export function generateLicenseKey(clientId: number, tier: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  const tierCode = tier.substring(0, 3).toUpperCase();

  return `EO-${tierCode}-${clientId}-${timestamp}-${random}`;
}

/**
 * VALIDATE LICENSE KEY
 */

export async function validateLicenseKey(licenseKey: string): Promise<boolean> {
  const client = await getClientByLicenseKey(licenseKey);

  if (!client) return false;
  if (client.status !== 'active') return false;

  return true;
}
