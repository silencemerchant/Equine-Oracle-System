/**
 * Client management router for LOWKEY CONSULTANTS multi-tenant system
 * Handles client CRUD, licensing, and deployment management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createClient,
  getClientByLicenseKey,
  getClientById,
  updateClientStatus,
  getAllClients,
  setClientConfig,
  getClientConfig,
  getAllClientConfigs,
  recordUsage,
  getClientUsage,
  createDeployment,
  getClientDeployments,
  updateDeploymentStatus,
  generateLicenseKey,
  validateLicenseKey,
  getLowkeyCompanyInfo,
  updateLowkeyCompanyInfo,
  logAuditEvent,
  getClientAuditLog,
} from '../db_multi_tenant';

/**
 * Client management procedures
 * Only accessible to admin users
 */
export const clientsRouter = router({
  /**
   * Create a new client (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(1),
        tier: z.enum(['basic', 'pro', 'api_starter', 'api_professional']),
        supportLevel: z.enum(['basic', 'priority', 'premium']).optional(),
        contactEmail: z.string().email(),
        contactPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create clients',
        });
      }

      const licenseKey = generateLicenseKey(Date.now(), input.tier);

      try {
        await createClient({
          companyName: input.companyName,
          licenseKey,
          tier: input.tier,
          status: 'active',
          supportLevel: input.supportLevel,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          metadata: {
            createdBy: ctx.user.id,
            createdAt: new Date().toISOString(),
          },
        });

        // Log audit event
        await logAuditEvent({
          userId: ctx.user.id,
          action: 'client_created',
          entityType: 'client',
          changes: {
            companyName: input.companyName,
            tier: input.tier,
            licenseKey,
          },
        });

        return {
          success: true,
          licenseKey,
          message: `Client ${input.companyName} created successfully`,
        };
      } catch (error) {
        console.error('Failed to create client:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create client',
        });
      }
    }),

  /**
   * Get client by license key (for client-side validation)
   */
  getByLicenseKey: protectedProcedure
    .input(z.object({ licenseKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const client = await getClientByLicenseKey(input.licenseKey);

        if (!client) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Client not found',
          });
        }

        return {
          id: client.id,
          companyName: client.companyName,
          tier: client.tier,
          status: client.status,
          supportLevel: client.supportLevel,
          deploymentUrl: client.deploymentUrl,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get client',
        });
      }
    }),

  /**
   * Get all clients (admin only)
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only admins can view all clients',
      });
    }

    try {
      const allClients = await getAllClients();
      return allClients.map(c => ({
        id: c.id,
        companyName: c.companyName,
        tier: c.tier,
        status: c.status,
        supportLevel: c.supportLevel,
        contactEmail: c.contactEmail,
        deploymentDate: c.deploymentDate,
      }));
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get clients',
      });
    }
  }),

  /**
   * Update client status (admin only)
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        status: z.enum(['active', 'suspended', 'inactive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update client status',
        });
      }

      try {
        await updateClientStatus(input.clientId, input.status);

        // Log audit event
        await logAuditEvent({
          clientId: input.clientId,
          userId: ctx.user.id,
          action: 'client_status_updated',
          entityType: 'client',
          changes: { status: input.status },
        });

        return { success: true, message: 'Client status updated' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update client status',
        });
      }
    }),

  /**
   * Set client configuration
   */
  setConfig: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can set client configuration',
        });
      }

      try {
        await setClientConfig(input.clientId, input.key, input.value);

        await logAuditEvent({
          clientId: input.clientId,
          userId: ctx.user.id,
          action: 'config_updated',
          entityType: 'client_config',
          changes: { [input.key]: input.value },
        });

        return { success: true, message: 'Configuration updated' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set configuration',
        });
      }
    }),

  /**
   * Get client configuration
   */
  getConfig: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        key: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        if (input.key) {
          const value = await getClientConfig(input.clientId, input.key);
          return { [input.key]: value };
        } else {
          return await getAllClientConfigs(input.clientId);
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get configuration',
        });
      }
    }),

  /**
   * Record client usage
   */
  recordUsage: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        metricName: z.string(),
        value: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await recordUsage(input.clientId, input.metricName, input.value);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record usage',
        });
      }
    }),

  /**
   * Get client usage metrics
   */
  getUsage: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        metricName: z.string(),
        hoursAgo: z.number().default(24),
      })
    )
    .query(async ({ input }) => {
      try {
        const usage = await getClientUsage(input.clientId, input.metricName, input.hoursAgo);
        const total = usage.reduce((sum, u) => sum + u.metricValue, 0);
        return {
          metricName: input.metricName,
          total,
          count: usage.length,
          data: usage,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get usage metrics',
        });
      }
    }),

  /**
   * Create deployment
   */
  createDeployment: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        deploymentType: z.enum(['docker', 'kubernetes', 'serverless']),
        deploymentUrl: z.string().optional(),
        version: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create deployments',
        });
      }

      try {
        await createDeployment({
          clientId: input.clientId,
          deploymentType: input.deploymentType,
          deploymentUrl: input.deploymentUrl,
          status: 'pending',
          version: input.version,
          metadata: {
            createdBy: ctx.user.id,
            createdAt: new Date().toISOString(),
          },
        });

        await logAuditEvent({
          clientId: input.clientId,
          userId: ctx.user.id,
          action: 'deployment_created',
          entityType: 'deployment',
          changes: {
            deploymentType: input.deploymentType,
            deploymentUrl: input.deploymentUrl,
          },
        });

        return { success: true, message: 'Deployment created' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create deployment',
        });
      }
    }),

  /**
   * Get client deployments
   */
  getDeployments: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getClientDeployments(input.clientId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get deployments',
        });
      }
    }),

  /**
   * Update deployment status
   */
  updateDeploymentStatus: protectedProcedure
    .input(
      z.object({
        deploymentId: z.number(),
        status: z.enum(['pending', 'deploying', 'active', 'failed', 'inactive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update deployment status',
        });
      }

      try {
        await updateDeploymentStatus(input.deploymentId, input.status);

        await logAuditEvent({
          userId: ctx.user.id,
          action: 'deployment_status_updated',
          entityType: 'deployment',
          entityId: input.deploymentId,
          changes: { status: input.status },
        });

        return { success: true, message: 'Deployment status updated' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update deployment status',
        });
      }
    }),

  /**
   * Get LOWKEY company info
   */
  getLowkeyInfo: protectedProcedure.query(async () => {
    try {
      const info = await getLowkeyCompanyInfo();
      return info || { status: 'not_configured' };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get company info',
      });
    }
  }),

  /**
   * Update LOWKEY company info (admin only)
   */
  updateLowkeyInfo: protectedProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        companyNumber: z.string().optional(),
        incorporationDate: z.date().optional(),
        status: z.string().optional(),
        contactEmail: z.string().email().optional(),
        website: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update company info',
        });
      }

      try {
        await updateLowkeyCompanyInfo(input);

        await logAuditEvent({
          userId: ctx.user.id,
          action: 'lowkey_info_updated',
          entityType: 'company_info',
          changes: input,
        });

        return { success: true, message: 'Company info updated' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update company info',
        });
      }
    }),

  /**
   * Get client audit log (admin only)
   */
  getAuditLog: protectedProcedure
    .input(z.object({ clientId: z.number(), limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view audit logs',
        });
      }

      try {
        return await getClientAuditLog(input.clientId, input.limit);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get audit log',
        });
      }
    }),

  /**
   * Validate license key
   */
  validateLicense: protectedProcedure
    .input(z.object({ licenseKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const isValid = await validateLicenseKey(input.licenseKey);
        return { isValid };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate license',
        });
      }
    }),
});
