# Equine Oracle - Monetization System

**Status:** Ready for Launch  
**Target Launch Date:** December 15, 2024  
**Revenue Goal:** NZ$2,000+ MRR by January 31, 2025

---

## WHAT'S INCLUDED

This complete monetization system includes everything needed to generate revenue from the Equine Oracle prediction API:

### Backend Infrastructure
- **Stripe Integration:** Complete payment processing with customer management, subscription creation, and billing portal access
- **Database Schema:** Tables for subscriptions, API keys, usage tracking, and billing records
- **tRPC Procedures:** Secure endpoints for subscription management and API key generation
- **Webhook Handling:** Automatic updates when Stripe events occur

### Frontend Components
- **Landing Page:** Professional marketing site with pricing tiers and feature highlights
- **Dashboard:** User account management with subscription status and API key management
- **Subscription Management:** Easy tier selection and billing portal access
- **API Key Management:** Generate, list, and revoke API keys with one-click access

### Documentation & Playbooks
- **MONETIZATION_STRATEGY.md:** Detailed pricing strategy, revenue projections, and positioning
- **LAUNCH_PLAYBOOK.md:** Week-by-week execution plan with marketing tactics
- **IMPLEMENTATION_GUIDE.md:** Step-by-step setup instructions for independent execution

---

## PRICING TIERS

### Predictor Basic - NZ$29/month
For casual bettors who want to improve their decision-making:
- 5 predictions per day
- Confidence scores and betting signals
- Email notifications
- 7-day prediction history
- Basic analytics dashboard

### Predictor Pro - NZ$79/month
For serious bettors and systems traders:
- Unlimited daily predictions
- Advanced analytics (ROI tracking, model comparison)
- Confidence calibration reports
- SMS + email alerts
- 90-day prediction history
- Monthly performance reports
- Priority support

### Oracle API - Starter - NZ$199/month
For developers building betting tools:
- REST API access to prediction engine
- 10,000 API calls/month
- Webhook notifications
- Basic support

### Oracle API - Professional - NZ$499/month
For platforms and syndicates:
- REST API access
- 100,000 API calls/month
- Custom model parameters
- SLA support (4-hour response)
- Usage analytics

---

## REVENUE PROJECTIONS

### Conservative Scenario
- Month 1 (Dec): NZ$448
- Month 2 (Jan): NZ$1,991
- Month 3 (Feb): NZ$4,203
- Year 1 Total: NZ$18,000-24,000

### Moderate Scenario
- Month 1 (Dec): NZ$600
- Month 2 (Jan): NZ$2,800
- Month 3 (Feb): NZ$6,200
- Year 1 Total: NZ$36,000-48,000

### Optimistic Scenario
- Month 1 (Dec): NZ$1,000
- Month 2 (Jan): NZ$4,500
- Month 3 (Feb): NZ$9,000
- Year 1 Total: NZ$60,000+

**Key Assumptions:**
- Stripe fees: 2.9% + NZ$0.30 per transaction
- Hosting costs: ~NZ$50-100/month (already covered)
- Marketing: Organic only (no paid ads initially)
- Gross margin: ~95% (after Stripe fees)
- Net margin: ~90% (after hosting)

---

## SYSTEM ARCHITECTURE

### Database Schema

**subscriptions table:**
- Tracks user subscription status
- Stores Stripe customer ID and subscription ID
- Records tier, status, and renewal date

**apiKeys table:**
- Stores generated API keys
- Tracks creation and revocation
- Links to user account

**apiUsage table:**
- Logs API calls for rate limiting
- Tracks endpoint usage
- Enables usage-based analytics

**billingRecords table:**
- Stores invoice history
- Tracks payment status
- Enables billing reports

### Backend Services

**stripe_service.ts:**
- Customer creation and management
- Subscription creation and cancellation
- Billing portal session creation
- Webhook event handling
- API key generation

**Database Helpers (db.ts):**
- Subscription CRUD operations
- API key management
- Usage tracking
- Billing record management

### tRPC Routers

**subscription.ts:**
- `getTiers`: List available subscription tiers
- `getStatus`: Get user's current subscription
- `create`: Create new subscription
- `cancel`: Cancel active subscription
- `getBillingPortalUrl`: Access Stripe billing portal

**apiKey.ts:**
- `list`: List user's API keys
- `create`: Generate new API key
- `revoke`: Revoke an API key

---

## SETUP INSTRUCTIONS

### 1. Configure Stripe

1. Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Add environment variables:
   - `STRIPE_SECRET_KEY`: Your live secret key
   - `STRIPE_PUBLISHABLE_KEY`: Your live publishable key

### 2. Verify Database

Run database migrations to create tables:
```bash
pnpm db:push
```

### 3. Test the System

1. Open landing page at `/`
2. Sign in and go to `/dashboard`
3. Verify subscription tiers are displayed
4. Test subscription creation flow

### 4. Deploy to Production

Click the "Publish" button in the Management UI to deploy.

### 5. Execute Launch Playbook

Follow the week-by-week plan in `LAUNCH_PLAYBOOK.md` to:
- Soft launch to early users (Week 2)
- Public launch announcement (Week 3)
- Marketing execution (ongoing)

---

## MARKETING STRATEGY

### Target Market
New Zealand TAB horse racing bettors, ranging from casual weekend punters to serious systems traders.

### Marketing Channels

**Facebook Groups** (30 min/week)
- Join NZ horse racing communities
- Share genuine insights and predictions
- Build relationships with potential customers
- Expected: 5-10 signups/week

**Reddit** (20 min/week)
- Participate in r/newzealand, r/betting, r/horses
- Answer questions authentically
- Share relevant insights
- Expected: 1-2 signups/week

**Email Outreach** (30 min/week)
- Send personalized emails to betting communities
- Offer free trial or discount
- Share specific prediction examples
- Expected: 1-2 signups/week

**Content Marketing** (1 hour/week)
- Write blog posts about horse racing prediction
- Optimize for SEO
- Share on social media
- Expected: Organic growth over 2-3 months

**Affiliate Partnerships** (optional)
- Partner with horse racing blogs and forums
- Offer 20% commission on first month
- Expected: 50-200 referrals/month

---

## LAUNCH TIMELINE

### Week 1 (Dec 2-8): Pre-Launch
- Configure Stripe
- Test all systems
- Prepare marketing materials
- Set up social media accounts

### Week 2 (Dec 9-15): Soft Launch
- Invite 20-30 early users
- Collect feedback
- Fix any bugs
- Refine messaging

### Week 3 (Dec 16-22): Public Launch
- Announce publicly
- Ramp up marketing
- Monitor closely
- Respond to support

### Week 4 (Dec 23-29): Growth
- Holiday period (lower signups expected)
- Maintain systems
- Prepare January strategy

### January 2025: Scale
- Double down on best channels
- Implement improvements
- Target NZ$2,000+ MRR

---

## ADMIN REQUIREMENTS

### Daily (5-10 minutes)
- Check Stripe dashboard for new signups
- Review support emails
- Monitor server health
- Post on social media

### Weekly (1 hour)
- Respond to all support emails
- Analyze metrics (signups, revenue, churn)
- Post on social media (3-5 posts)
- Engage in forums/communities
- Review and fix bugs

### Monthly (2-3 hours)
- Analyze full month's data
- Calculate MRR and growth rate
- Review customer feedback
- Adjust marketing strategy
- Plan next month's focus

**Total Time Commitment:** 2-3 hours/week

---

## SUCCESS METRICS

### Key Performance Indicators
- **Monthly Recurring Revenue (MRR):** Target NZ$2,000+ by January 31
- **Customer Acquisition Cost (CAC):** Target <NZ$50
- **Lifetime Value (LTV):** Target >NZ$300
- **Churn Rate:** Target <10% monthly
- **Signup Conversion Rate:** Target 0.5-1% of visitors

### Validation Checkpoints
- **Week 2:** 5-10 signups (proof of concept)
- **Week 4:** 15-25 signups (traction)
- **January 31:** 40-50 total subscribers (growth)

---

## RISK MITIGATION

### Low Signup Rate
- A/B test landing page messaging
- Try multiple marketing channels
- Adjust pricing if needed
- Improve onboarding experience

### High Churn Rate
- Email churned users to understand why
- Improve onboarding and first-time value
- Add more features/content
- Offer annual plans to lock in revenue

### Payment Processing Issues
- Test thoroughly before launch
- Monitor Stripe dashboard closely
- Have fallback payment method ready
- Contact Stripe support if needed

### Model Accuracy Drops
- Continuous retraining system in place
- Monitor performance metrics
- Transparent communication with users
- Show actual vs. predicted results

---

## FILE STRUCTURE

```
equine-oracle-api/
├── MONETIZATION_STRATEGY.md      # Pricing and revenue strategy
├── LAUNCH_PLAYBOOK.md            # Week-by-week execution plan
├── IMPLEMENTATION_GUIDE.md       # Setup instructions
├── MONETIZATION_README.md        # This file
├── drizzle/
│   └── schema.ts                 # Database schema (updated)
├── server/
│   ├── db.ts                     # Database helpers (updated)
│   ├── routers.ts                # tRPC routers (updated)
│   ├── routers/
│   │   └── subscription.ts       # Subscription & API key routers
│   └── services/
│       ├── stripe_service.ts     # Stripe integration
│       └── apiKeyGenerator.ts    # API key generation
└── client/
    └── src/
        ├── pages/
        │   ├── Home.tsx          # Landing page (updated)
        │   └── Dashboard.tsx     # User dashboard (new)
        └── App.tsx               # Routes (updated)
```

---

## NEXT STEPS

1. **Today:** Configure Stripe keys and test the system
2. **Tomorrow:** Deploy to production
3. **Dec 9:** Begin soft launch
4. **Dec 16:** Public launch announcement
5. **January:** Scale based on data

---

## SUPPORT & DOCUMENTATION

- **Stripe Documentation:** https://stripe.com/docs
- **tRPC Documentation:** https://trpc.io
- **Drizzle ORM Documentation:** https://orm.drizzle.team

For questions or issues, refer to the implementation guide or check server logs for error messages.

---

**Created:** November 22, 2024  
**Status:** Ready for Launch  
**Maintained By:** You (with AI support between sessions)
