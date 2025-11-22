import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
});

export interface SubscriptionTier {
  id: 'basic' | 'pro' | 'api_starter' | 'api_professional';
  name: string;
  price: number; // NZD
  currency: 'nzd';
  billingPeriod: 'month' | 'year';
  features: string[];
  stripePriceId?: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  basic: {
    id: 'basic',
    name: 'Predictor Basic',
    price: 29,
    currency: 'nzd',
    billingPeriod: 'month',
    features: [
      '5 predictions per day',
      'Confidence scores & betting signals',
      'Email notifications',
      '7-day prediction history',
      'Basic analytics dashboard',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Predictor Pro',
    price: 79,
    currency: 'nzd',
    billingPeriod: 'month',
    features: [
      'Unlimited daily predictions',
      'Advanced analytics',
      'Confidence calibration reports',
      'SMS + email alerts',
      '90-day prediction history',
      'Monthly performance reports',
      'Priority support',
    ],
  },
  api_starter: {
    id: 'api_starter',
    name: 'Oracle API - Starter',
    price: 199,
    currency: 'nzd',
    billingPeriod: 'month',
    features: [
      'REST API access',
      '10,000 API calls/month',
      'Webhook notifications',
      'Basic support',
    ],
  },
  api_professional: {
    id: 'api_professional',
    name: 'Oracle API - Professional',
    price: 499,
    currency: 'nzd',
    billingPeriod: 'month',
    features: [
      'REST API access',
      '100,000 API calls/month',
      'Webhook notifications',
      'Custom model parameters',
      'SLA support (4-hour response)',
      'Usage analytics',
    ],
  },
};

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(
  userId: number,
  email: string,
  name?: string
) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });

    return customer;
  } catch (error) {
    console.error('Failed to create Stripe customer:', error);
    throw error;
  }
}

/**
 * Create a subscription for a user
 */
export async function createSubscription(
  customerId: string,
  tierId: string
) {
  const tier = SUBSCRIPTION_TIERS[tierId];
  if (!tier) {
    throw new Error(`Invalid tier: ${tierId}`);
  }

  try {
    // Create or get price ID
    let priceId = tier.stripePriceId;
    if (!priceId) {
      // Create a new price in Stripe
      const price = await stripe.prices.create({
        currency: 'nzd',
        unit_amount: tier.price * 100, // Convert to cents
        recurring: {
          interval: tier.billingPeriod === 'month' ? 'month' : 'year',
        },
        product_data: {
          name: tier.name,
          description: tier.features.join(', '),
        },
      });
      priceId = price.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.del(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Failed to retrieve subscription:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  const db = await getDb();
  if (!db) {
    console.warn('Database not available for webhook processing');
    return;
  }

  switch (event.type) {
    case 'customer.subscription.created':
      console.log('Subscription created:', event.data.object);
      // Update user subscription status in database
      break;

    case 'customer.subscription.updated':
      console.log('Subscription updated:', event.data.object);
      // Update user subscription status in database
      break;

    case 'customer.subscription.deleted':
      console.log('Subscription deleted:', event.data.object);
      // Update user subscription status in database
      break;

    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object);
      // Send confirmation email, update billing record
      break;

    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object);
      // Send retry notification email
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }
}

/**
 * Generate an API key for a user
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'eo_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate an API key
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  // This would check against your database of valid API keys
  // For now, just validate format
  return apiKey.startsWith('eo_') && apiKey.length === 35;
}

/**
 * Get customer's subscription status
 */
export async function getCustomerSubscriptionStatus(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return null;
    }

    const subscription = subscriptions.data[0];
    const item = subscription.items.data[0];
    const price = item.price;

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      priceId: price.id,
      amount: price.unit_amount ? price.unit_amount / 100 : 0,
      currency: price.currency,
      interval: price.recurring?.interval || 'month',
    };
  } catch (error) {
    console.error('Failed to get customer subscription status:', error);
    return null;
  }
}

/**
 * Create a billing portal session for customer self-service
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Failed to create billing portal session:', error);
    throw error;
  }
}
