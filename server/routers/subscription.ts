import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createStripeCustomer, createSubscription, cancelSubscription, getCustomerSubscriptionStatus, createBillingPortalSession, SUBSCRIPTION_TIERS } from "../services/stripe_service";
import { createSubscription as dbCreateSubscription, getSubscriptionByUserId, updateSubscription as dbUpdateSubscription, createApiKey, getApiKeysByUserId, revokeApiKey } from "../db";
import { generateApiKey } from "../services/apiKeyGenerator";
import { TRPCError } from "@trpc/server";

export const subscriptionRouter = router({
  /**
   * Get available subscription tiers
   */
  getTiers: publicProcedure.query(() => {
    return Object.values(SUBSCRIPTION_TIERS);
  }),

  /**
   * Get current user's subscription status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await getSubscriptionByUserId(ctx.user.id);
      
      if (!subscription) {
        return {
          hasSubscription: false,
          tier: null,
          status: null,
          currentPeriodEnd: null,
        };
      }

      return {
        hasSubscription: subscription.status === "active",
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
      };
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription status",
      });
    }
  }),

  /**
   * Create a new subscription
   */
  create: protectedProcedure
    .input(z.object({
      tierId: z.enum(["basic", "pro", "api_starter", "api_professional"]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user already has an active subscription
        const existing = await getSubscriptionByUserId(ctx.user.id);
        if (existing && existing.status === "active") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already has an active subscription",
          });
        }

        // Create Stripe customer if not exists
        let customerId = existing?.stripeCustomerId;
        if (!customerId) {
          const customer = await createStripeCustomer(
            ctx.user.id,
            ctx.user.email || "",
            ctx.user.name || undefined
          );
          customerId = customer.id;
        }

        // Create Stripe subscription
        const stripeSubscription = await createSubscription(customerId, input.tierId);

        // Save to database
        if (existing) {
          await dbUpdateSubscription(existing.id, {
            tier: input.tierId as any,
            stripeSubscriptionId: stripeSubscription.id,
            status: stripeSubscription.status as any,
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          });
        } else {
          await dbCreateSubscription({
            userId: ctx.user.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: stripeSubscription.id,
            tier: input.tierId as any,
            status: stripeSubscription.status as any,
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          });
        }

        return {
          success: true,
          subscriptionId: stripeSubscription.id,
          clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
        };
      } catch (error) {
        console.error("Failed to create subscription:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create subscription",
        });
      }
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const subscription = await getSubscriptionByUserId(ctx.user.id);
      
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found",
        });
      }

      await cancelSubscription(subscription.stripeSubscriptionId);
      
      await dbUpdateSubscription(subscription.id, {
        status: "canceled",
        canceledAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Get billing portal URL for customer self-service
   */
  getBillingPortalUrl: protectedProcedure
    .input(z.object({
      returnUrl: z.string().url(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const subscription = await getSubscriptionByUserId(ctx.user.id);
        
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No subscription found",
          });
        }

        const session = await createBillingPortalSession(
          subscription.stripeCustomerId,
          input.returnUrl
        );

        return { url: session.url };
      } catch (error) {
        console.error("Failed to get billing portal URL:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get billing portal URL",
        });
      }
    }),
});

/**
 * API Key management router
 */
export const apiKeyRouter = router({
  /**
   * List user's API keys
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const keys = await getApiKeysByUserId(ctx.user.id);
      return keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPreview: key.key.substring(0, 10) + "...",
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
      }));
    } catch (error) {
      console.error("Failed to list API keys:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch API keys",
      });
    }
  }),

  /**
   * Create a new API key
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check subscription status
        const subscription = await getSubscriptionByUserId(ctx.user.id);
        if (!subscription || subscription.status !== "active") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required for API access",
          });
        }

        const key = generateApiKey();
        const created = await createApiKey({
          userId: ctx.user.id,
          key,
          name: input.name,
        });

        return {
          id: created.id,
          name: created.name,
          key: key, // Only show full key once on creation
          createdAt: created.createdAt,
        };
      } catch (error) {
        console.error("Failed to create API key:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create API key",
        });
      }
    }),

  /**
   * Revoke an API key
   */
  revoke: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const keys = await getApiKeysByUserId(ctx.user.id);
        const keyExists = keys.some(k => k.id === input.id);
        
        if (!keyExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "API key not found",
          });
        }

        await revokeApiKey(input.id);
        return { success: true };
      } catch (error) {
        console.error("Failed to revoke API key:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to revoke API key",
        });
      }
    }),
});
