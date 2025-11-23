import {
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  mysqlTable,
  json,
  boolean,
  decimal,
} from 'drizzle-orm/mysql-core';

/**
 * Multi-tenant schema extension for LOWKEY CONSULTANTS
 * Supports package sales and client management
 */

/**
 * Clients table - Represents each deployed instance
 */
export const clients = mysqlTable('clients', {
  id: int('id').autoincrement().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  licenseKey: varchar('license_key', { length: 64 }).notNull().unique(),
  tier: varchar('tier', { length: 50 }).notNull(), // 'basic', 'pro', 'api_starter', 'api_professional'
  status: mysqlEnum('status', ['active', 'suspended', 'inactive']).default('active').notNull(),
  deploymentDate: timestamp('deployment_date'),
  supportLevel: varchar('support_level', { length: 50 }), // 'basic', 'priority', 'premium'
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  deploymentUrl: varchar('deployment_url', { length: 255 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Client configurations - Store client-specific settings
 */
export const clientConfigs = mysqlTable('client_configs', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  configKey: varchar('config_key', { length: 255 }).notNull(),
  configValue: text('config_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type ClientConfig = typeof clientConfigs.$inferSelect;
export type InsertClientConfig = typeof clientConfigs.$inferInsert;

/**
 * Usage tracking - Monitor API usage per client
 */
export const clientUsage = mysqlTable('client_usage', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  metricName: varchar('metric_name', { length: 255 }).notNull(), // 'api_calls', 'predictions', 'storage_gb'
  metricValue: int('metric_value').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

export type ClientUsage = typeof clientUsage.$inferSelect;
export type InsertClientUsage = typeof clientUsage.$inferInsert;

/**
 * Deployments - Track deployment history
 */
export const deployments = mysqlTable('deployments', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  deploymentType: varchar('deployment_type', { length: 50 }).notNull(), // 'docker', 'kubernetes', 'serverless'
  deploymentUrl: varchar('deployment_url', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'deploying', 'active', 'failed', 'inactive']).default('pending').notNull(),
  deployedAt: timestamp('deployed_at'),
  version: varchar('version', { length: 50 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

/**
 * Client billing - Track invoices and payments
 */
export const clientBilling = mysqlTable('client_billing', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('nzd').notNull(),
  status: mysqlEnum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft').notNull(),
  billingPeriodStart: timestamp('billing_period_start'),
  billingPeriodEnd: timestamp('billing_period_end'),
  dueDate: timestamp('due_date'),
  paidDate: timestamp('paid_date'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type ClientBilling = typeof clientBilling.$inferSelect;
export type InsertClientBilling = typeof clientBilling.$inferInsert;

/**
 * Service contracts - Track service agreements with clients
 */
export const serviceContracts = mysqlTable('service_contracts', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  contractType: varchar('contract_type', { length: 50 }).notNull(), // 'deployment', 'support', 'maintenance'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  terms: text('terms'),
  monthlyFee: decimal('monthly_fee', { precision: 10, scale: 2 }),
  status: mysqlEnum('status', ['active', 'expired', 'cancelled']).default('active').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type ServiceContract = typeof serviceContracts.$inferSelect;
export type InsertServiceContract = typeof serviceContracts.$inferInsert;

/**
 * Client team members - Track who has access to each deployment
 */
export const clientTeamMembers = mysqlTable('client_team_members', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  userId: int('user_id').notNull(),
  role: mysqlEnum('role', ['admin', 'manager', 'user', 'viewer']).default('user').notNull(),
  permissions: json('permissions'),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  status: mysqlEnum('status', ['pending', 'active', 'inactive']).default('pending').notNull(),
});

export type ClientTeamMember = typeof clientTeamMembers.$inferSelect;
export type InsertClientTeamMember = typeof clientTeamMembers.$inferInsert;

/**
 * Support tickets - Track client support requests
 */
export const supportTickets = mysqlTable('support_tickets', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id').notNull(),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'critical']).default('medium').notNull(),
  status: mysqlEnum('status', ['open', 'in_progress', 'resolved', 'closed']).default('open').notNull(),
  assignedTo: int('assigned_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Audit log - Track all client-related changes
 */
export const auditLog = mysqlTable('audit_log', {
  id: int('id').autoincrement().primaryKey(),
  clientId: int('client_id'),
  userId: int('user_id'),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: int('entity_id'),
  changes: json('changes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

/**
 * LOWKEY CONSULTANTS company details
 */
export const lowkeyCompanyInfo = mysqlTable('lowkey_company_info', {
  id: int('id').primaryKey().default(1), // Single row
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  incorporationDate: timestamp('incorporation_date'),
  status: varchar('status', { length: 50 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  website: varchar('website', { length: 255 }),
  address: text('address'),
  metadata: json('metadata'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type LowkeyCompanyInfo = typeof lowkeyCompanyInfo.$inferSelect;
export type InsertLowkeyCompanyInfo = typeof lowkeyCompanyInfo.$inferInsert;
