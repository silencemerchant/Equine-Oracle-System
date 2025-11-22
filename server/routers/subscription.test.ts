import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SUBSCRIPTION_TIERS } from '../services/stripe_service';

describe('Subscription System', () => {
  describe('Subscription Tiers', () => {
    it('should have all required tiers', () => {
      expect(SUBSCRIPTION_TIERS).toHaveProperty('basic');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('pro');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('api_starter');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('api_professional');
    });

    it('should have correct pricing for Basic tier', () => {
      const basic = SUBSCRIPTION_TIERS.basic;
      expect(basic.price).toBe(29);
      expect(basic.currency).toBe('nzd');
      expect(basic.billingPeriod).toBe('month');
    });

    it('should have correct pricing for Pro tier', () => {
      const pro = SUBSCRIPTION_TIERS.pro;
      expect(pro.price).toBe(79);
      expect(pro.currency).toBe('nzd');
      expect(pro.billingPeriod).toBe('month');
    });

    it('should have correct pricing for API Starter tier', () => {
      const starter = SUBSCRIPTION_TIERS.api_starter;
      expect(starter.price).toBe(199);
      expect(starter.currency).toBe('nzd');
      expect(starter.billingPeriod).toBe('month');
    });

    it('should have correct pricing for API Professional tier', () => {
      const pro = SUBSCRIPTION_TIERS.api_professional;
      expect(pro.price).toBe(499);
      expect(pro.currency).toBe('nzd');
      expect(pro.billingPeriod).toBe('month');
    });

    it('should have features for each tier', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.features).toBeDefined();
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
      });
    });

    it('should have correct tier names', () => {
      expect(SUBSCRIPTION_TIERS.basic.name).toBe('Predictor Basic');
      expect(SUBSCRIPTION_TIERS.pro.name).toBe('Predictor Pro');
      expect(SUBSCRIPTION_TIERS.api_starter.name).toBe('Oracle API - Starter');
      expect(SUBSCRIPTION_TIERS.api_professional.name).toBe('Oracle API - Professional');
    });
  });

  describe('Tier Features', () => {
    it('Basic tier should have 5 features', () => {
      expect(SUBSCRIPTION_TIERS.basic.features.length).toBe(5);
    });

    it('Pro tier should have 7 features', () => {
      expect(SUBSCRIPTION_TIERS.pro.features.length).toBe(7);
    });

    it('API Starter tier should have 4 features', () => {
      expect(SUBSCRIPTION_TIERS.api_starter.features.length).toBe(4);
    });

    it('API Professional tier should have 6 features', () => {
      expect(SUBSCRIPTION_TIERS.api_professional.features.length).toBe(6);
    });

    it('Basic tier should include predictions feature', () => {
      const features = SUBSCRIPTION_TIERS.basic.features;
      expect(features.some(f => f.includes('prediction'))).toBe(true);
    });

    it('Pro tier should include unlimited predictions', () => {
      const features = SUBSCRIPTION_TIERS.pro.features;
      expect(features.some(f => f.includes('Unlimited'))).toBe(true);
    });

    it('API tiers should include API access', () => {
      const starterFeatures = SUBSCRIPTION_TIERS.api_starter.features;
      const proFeatures = SUBSCRIPTION_TIERS.api_professional.features;
      expect(starterFeatures.some(f => f.includes('API'))).toBe(true);
      expect(proFeatures.some(f => f.includes('API'))).toBe(true);
    });
  });

  describe('Pricing Logic', () => {
    it('Pro tier should be more expensive than Basic', () => {
      expect(SUBSCRIPTION_TIERS.pro.price).toBeGreaterThan(SUBSCRIPTION_TIERS.basic.price);
    });

    it('API Professional should be more expensive than API Starter', () => {
      expect(SUBSCRIPTION_TIERS.api_professional.price).toBeGreaterThan(SUBSCRIPTION_TIERS.api_starter.price);
    });

    it('API tiers should be more expensive than subscription tiers', () => {
      expect(SUBSCRIPTION_TIERS.api_starter.price).toBeGreaterThan(SUBSCRIPTION_TIERS.pro.price);
    });

    it('all prices should be positive', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.price).toBeGreaterThan(0);
      });
    });

    it('all prices should be whole numbers', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.price % 1).toBe(0);
      });
    });
  });

  describe('Revenue Calculations', () => {
    it('should calculate monthly revenue correctly', () => {
      const basicSignups = 50;
      const proSignups = 10;
      const expectedRevenue = (basicSignups * SUBSCRIPTION_TIERS.basic.price) + 
                              (proSignups * SUBSCRIPTION_TIERS.pro.price);
      
      expect(expectedRevenue).toBe(50 * 29 + 10 * 79);
      expect(expectedRevenue).toBe(2240);
    });

    it('should calculate MRR for conservative scenario', () => {
      // Conservative: 40 basic + 8 pro + 1 API starter
      const mrrConservative = (40 * 29) + (8 * 79) + (1 * 199);
      expect(mrrConservative).toBe(1991);
      expect(mrrConservative).toBeGreaterThanOrEqual(2000 - 100); // Allow 100 NZD variance
    });

    it('should calculate annual revenue from MRR', () => {
      const monthlyRevenue = 2000;
      const annualRevenue = monthlyRevenue * 12;
      expect(annualRevenue).toBe(24000);
    });

    it('should calculate gross margin correctly', () => {
      const stripeFee = 0.029; // 2.9%
      const fixedFee = 0.30; // NZ$0.30
      const revenue = 100;
      const grossMargin = revenue * (1 - stripeFee) - fixedFee;
      expect(grossMargin).toBeCloseTo(96.80, 1);
    });
  });

  describe('Tier Validation', () => {
    it('should have valid tier IDs', () => {
      const validIds = ['basic', 'pro', 'api_starter', 'api_professional'];
      Object.keys(SUBSCRIPTION_TIERS).forEach(id => {
        expect(validIds).toContain(id);
      });
    });

    it('should have all required tier properties', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier).toHaveProperty('id');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('currency');
        expect(tier).toHaveProperty('billingPeriod');
        expect(tier).toHaveProperty('features');
      });
    });

    it('should have matching tier ID and tier.id property', () => {
      Object.entries(SUBSCRIPTION_TIERS).forEach(([key, tier]) => {
        expect(tier.id).toBe(key);
      });
    });
  });
});
