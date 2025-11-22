import { describe, it, expect } from 'vitest';
import { SUBSCRIPTION_TIERS } from './stripe_service';

describe('Stripe Service - Subscription Tiers', () => {
  describe('Tier Configuration', () => {
    it('should have all required tiers defined', () => {
      expect(SUBSCRIPTION_TIERS).toHaveProperty('basic');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('pro');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('api_starter');
      expect(SUBSCRIPTION_TIERS).toHaveProperty('api_professional');
    });

    it('should have exactly 4 tiers', () => {
      expect(Object.keys(SUBSCRIPTION_TIERS).length).toBe(4);
    });
  });

  describe('Basic Tier', () => {
    const basic = SUBSCRIPTION_TIERS.basic;

    it('should have correct ID', () => {
      expect(basic.id).toBe('basic');
    });

    it('should have correct name', () => {
      expect(basic.name).toBe('Predictor Basic');
    });

    it('should have correct price', () => {
      expect(basic.price).toBe(29);
    });

    it('should use NZD currency', () => {
      expect(basic.currency).toBe('nzd');
    });

    it('should be monthly billing', () => {
      expect(basic.billingPeriod).toBe('month');
    });

    it('should have 5 features', () => {
      expect(basic.features.length).toBe(5);
    });

    it('should include prediction features', () => {
      const hasPredict = basic.features.some(f => f.includes('prediction'));
      expect(hasPredict).toBe(true);
    });
  });

  describe('Pro Tier', () => {
    const pro = SUBSCRIPTION_TIERS.pro;

    it('should have correct ID', () => {
      expect(pro.id).toBe('pro');
    });

    it('should have correct name', () => {
      expect(pro.name).toBe('Predictor Pro');
    });

    it('should have correct price', () => {
      expect(pro.price).toBe(79);
    });

    it('should be more expensive than Basic', () => {
      expect(pro.price).toBeGreaterThan(SUBSCRIPTION_TIERS.basic.price);
    });

    it('should have 7 features', () => {
      expect(pro.features.length).toBe(7);
    });

    it('should include unlimited predictions', () => {
      const hasUnlimited = pro.features.some(f => f.includes('Unlimited'));
      expect(hasUnlimited).toBe(true);
    });

    it('should include advanced analytics', () => {
      const hasAnalytics = pro.features.some(f => f.includes('analytics'));
      expect(hasAnalytics).toBe(true);
    });
  });

  describe('API Starter Tier', () => {
    const starter = SUBSCRIPTION_TIERS.api_starter;

    it('should have correct ID', () => {
      expect(starter.id).toBe('api_starter');
    });

    it('should have correct name', () => {
      expect(starter.name).toBe('Oracle API - Starter');
    });

    it('should have correct price', () => {
      expect(starter.price).toBe(199);
    });

    it('should be more expensive than Pro', () => {
      expect(starter.price).toBeGreaterThan(SUBSCRIPTION_TIERS.pro.price);
    });

    it('should have 4 features', () => {
      expect(starter.features.length).toBe(4);
    });

    it('should include API access', () => {
      const hasAPI = starter.features.some(f => f.includes('API'));
      expect(hasAPI).toBe(true);
    });

    it('should include call limit', () => {
      const hasLimit = starter.features.some(f => f.includes('10,000'));
      expect(hasLimit).toBe(true);
    });
  });

  describe('API Professional Tier', () => {
    const pro = SUBSCRIPTION_TIERS.api_professional;

    it('should have correct ID', () => {
      expect(pro.id).toBe('api_professional');
    });

    it('should have correct name', () => {
      expect(pro.name).toBe('Oracle API - Professional');
    });

    it('should have correct price', () => {
      expect(pro.price).toBe(499);
    });

    it('should be most expensive tier', () => {
      const allPrices = Object.values(SUBSCRIPTION_TIERS).map(t => t.price);
      expect(pro.price).toBe(Math.max(...allPrices));
    });

    it('should have 6 features', () => {
      expect(pro.features.length).toBe(6);
    });

    it('should include higher call limit', () => {
      const hasHigherLimit = pro.features.some(f => f.includes('100,000'));
      expect(hasHigherLimit).toBe(true);
    });

    it('should include SLA support', () => {
      const hasSLA = pro.features.some(f => f.includes('SLA'));
      expect(hasSLA).toBe(true);
    });
  });

  describe('Pricing Logic', () => {
    it('should have increasing prices for subscription tiers', () => {
      expect(SUBSCRIPTION_TIERS.basic.price).toBeLessThan(SUBSCRIPTION_TIERS.pro.price);
    });

    it('should have all positive prices', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.price).toBeGreaterThan(0);
      });
    });

    it('should have all whole number prices', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.price % 1).toBe(0);
      });
    });

    it('should have reasonable price differences', () => {
      const basicToProDiff = SUBSCRIPTION_TIERS.pro.price - SUBSCRIPTION_TIERS.basic.price;
      const proToStarterDiff = SUBSCRIPTION_TIERS.api_starter.price - SUBSCRIPTION_TIERS.pro.price;
      
      expect(basicToProDiff).toBeGreaterThan(0);
      expect(proToStarterDiff).toBeGreaterThan(0);
    });
  });

  describe('Revenue Projections', () => {
    it('should support conservative scenario calculation', () => {
      // Conservative: 40 basic + 8 pro + 1 API starter
      const revenue = (40 * SUBSCRIPTION_TIERS.basic.price) +
                     (8 * SUBSCRIPTION_TIERS.pro.price) +
                     (1 * SUBSCRIPTION_TIERS.api_starter.price);
      
      expect(revenue).toBe(1991);
    });

    it('should support moderate scenario calculation', () => {
      // Moderate: 60 basic + 15 pro + 2 API starter
      const revenue = (60 * SUBSCRIPTION_TIERS.basic.price) +
                     (15 * SUBSCRIPTION_TIERS.pro.price) +
                     (2 * SUBSCRIPTION_TIERS.api_starter.price);
      
      expect(revenue).toBeGreaterThan(2500);
    });

    it('should support optimistic scenario calculation', () => {
      // Optimistic: 100 basic + 30 pro + 5 API
      const revenue = (100 * SUBSCRIPTION_TIERS.basic.price) +
                     (30 * SUBSCRIPTION_TIERS.pro.price) +
                     (5 * SUBSCRIPTION_TIERS.api_starter.price);
      
      expect(revenue).toBeGreaterThan(5000);
    });

    it('should calculate annual revenue from monthly', () => {
      const monthlyRevenue = 2000;
      const annualRevenue = monthlyRevenue * 12;
      expect(annualRevenue).toBe(24000);
    });

    it('should account for Stripe fees in margin calculation', () => {
      const stripeFeePercent = 0.029; // 2.9%
      const stripeFeeFixed = 0.30; // NZ$0.30
      const revenue = 100;
      
      const grossProceeds = revenue * (1 - stripeFeePercent) - stripeFeeFixed;
      expect(grossProceeds).toBeCloseTo(96.80, 1);
    });
  });

  describe('Tier Consistency', () => {
    it('should have matching tier IDs and keys', () => {
      Object.entries(SUBSCRIPTION_TIERS).forEach(([key, tier]) => {
        expect(tier.id).toBe(key);
      });
    });

    it('should have all tiers with required properties', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier).toHaveProperty('id');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('currency');
        expect(tier).toHaveProperty('billingPeriod');
        expect(tier).toHaveProperty('features');
      });
    });

    it('should have non-empty feature lists', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
        tier.features.forEach(feature => {
          expect(typeof feature).toBe('string');
          expect(feature.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have consistent billing periods', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(['month', 'year']).toContain(tier.billingPeriod);
      });
    });

    it('should use NZD for all tiers', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.currency).toBe('nzd');
      });
    });
  });

  describe('Market Positioning', () => {
    it('should have clear tier differentiation', () => {
      const prices = Object.values(SUBSCRIPTION_TIERS).map(t => t.price);
      const uniquePrices = new Set(prices);
      expect(uniquePrices.size).toBe(prices.length);
    });

    it('should have descriptive tier names', () => {
      Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
        expect(tier.name.length).toBeGreaterThan(5);
      });
    });

    it('should target different customer segments', () => {
      const basicFeatures = SUBSCRIPTION_TIERS.basic.features.join(' ').toLowerCase();
      const proFeatures = SUBSCRIPTION_TIERS.pro.features.join(' ').toLowerCase();
      const apiFeatures = SUBSCRIPTION_TIERS.api_starter.features.join(' ').toLowerCase();
      
      // Basic should focus on casual use
      expect(basicFeatures).toContain('prediction');
      
      // Pro should focus on advanced features
      expect(proFeatures).toContain('unlimited');
      
      // API should focus on integration
      expect(apiFeatures).toContain('api');
    });
  });
});
