# Equine Oracle - Implementation Guide

**For:** Independent execution between AI sessions  
**Purpose:** Complete monetization system setup and launch  
**Time to Complete:** 2-4 weeks to first revenue

---

## OVERVIEW

This guide walks you through setting up the complete monetization system for Equine Oracle. The system includes Stripe payment processing, subscription management, API key generation, and a user dashboard.

**What's Already Built:**
- Stripe integration (backend service)
- Database schema for subscriptions, API keys, and billing
- tRPC procedures for subscription and API key management
- Landing page with pricing tiers
- Dashboard page for user account management
- Launch playbook with week-by-week execution plan

**What You Need to Do:**
1. Configure Stripe credentials
2. Test the payment flow
3. Deploy to production
4. Execute the launch playbook

---

## STEP 1: STRIPE SETUP

### 1.1 Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign in with your NZ Stripe account
3. Navigate to **Developers > API Keys**
4. Copy your **Secret Key** (starts with `sk_live_`)
5. Copy your **Publishable Key** (starts with `pk_live_`)

### 1.2 Add Environment Variables

Contact your hosting provider or use the Management UI to add these secrets:

**Environment Variable Name:** `STRIPE_SECRET_KEY`  
**Value:** Your Secret Key from step 1.4

**Environment Variable Name:** `STRIPE_PUBLISHABLE_KEY`  
**Value:** Your Publishable Key from step 1.5

### 1.3 Test Stripe Connection

Once environment variables are set, the system will automatically:
- Create Stripe customers when users sign up
- Process subscription payments
- Handle billing portal access
- Track usage and billing

---

## STEP 2: DATABASE VERIFICATION

### 2.1 Check Database Tables

The following tables should exist in your database:

**subscriptions table:**
- Stores user subscription status
- Tracks Stripe customer IDs
- Records subscription tier and renewal dates

**apiKeys table:**
- Stores generated API keys
- Tracks key creation and revocation

**apiUsage table:**
- Logs API calls for rate limiting
- Tracks usage per user

**billingRecords table:**
- Stores invoice history
- Tracks payment status

If these tables don't exist, run: `pnpm db:push`

### 2.2 Verify Database Connection

Test that the database is connected:
1. Go to Dashboard page
2. Sign in with your account
3. Try to view subscription status
4. You should see "No Active Subscription"

If you see an error, check that `DATABASE_URL` environment variable is set correctly.

---

## STEP 3: LANDING PAGE & DASHBOARD TESTING

### 3.1 Test Landing Page

1. Open your website at the root URL (`/`)
2. Verify you see:
   - Hero section with "Stop Guessing. Start Winning."
   - Feature cards (AI-Powered, Real-Time Signals, etc.)
   - Pricing tiers (Basic, Pro, API tiers)
   - Call-to-action buttons

3. Click "Get Started" button
4. You should be redirected to sign in or dashboard

### 3.2 Test Dashboard

1. Sign in with your account
2. Go to `/dashboard`
3. Verify you see:
   - **Subscription Tab:** Shows pricing tiers and "No Active Subscription"
   - **API Keys Tab:** Shows "Subscription Required" message

4. Try to create a subscription (this will fail without Stripe, but the flow should work)

### 3.3 Test Responsive Design

1. Open landing page on mobile device or use browser dev tools
2. Verify layout adapts properly
3. Check that buttons and text are readable
4. Test on tablet size as well

---

## STEP 4: STRIPE PAYMENT FLOW SETUP

### 4.1 Implement Stripe Checkout

The current system creates subscriptions but doesn't handle payment collection. You need to add Stripe Checkout.

**Option A: Stripe Hosted Checkout (Recommended)**

This is the easiest approach. Add to your Dashboard component:

```typescript
// In Dashboard.tsx, update the handleCreateSubscription function
const handleCreateSubscription = async (tierId: string) => {
  try {
    const result = await createSubscription.mutateAsync({ tierId: tierId as any });
    
    // Redirect to Stripe Checkout
    if (result.clientSecret) {
      // In production, you would redirect to a checkout page
      // For now, show success message
      toast.success("Subscription created! Payment processing...");
    }
  } catch (error) {
    toast.error("Failed to create subscription");
  }
};
```

**Option B: Stripe.js (More Control)**

If you want more control over the payment flow, use Stripe.js:

1. Install Stripe.js: `pnpm add @stripe/stripe-js`
2. Create a payment component
3. Handle payment confirmation
4. Update subscription status in database

### 4.2 Test Payment Flow

**Using Stripe Test Cards:**

1. Make sure you're in test mode (check Stripe dashboard)
2. Use test card: `4242 4242 4242 4242`
3. Use any future expiry date
4. Use any 3-digit CVC
5. Try to create a subscription
6. Check Stripe dashboard for test transaction

---

## STEP 5: DEPLOYMENT

### 5.1 Pre-Deployment Checklist

Before going live, verify:

- [ ] Stripe keys are configured (live keys, not test keys)
- [ ] Database is connected and tables exist
- [ ] Landing page is deployed and accessible
- [ ] Dashboard page is deployed and accessible
- [ ] All tRPC procedures are working
- [ ] Email notifications are configured
- [ ] SSL certificate is valid
- [ ] Error logging is enabled

### 5.2 Deploy to Production

Your hosting provider should have a "Deploy" or "Publish" button. Click it to deploy the latest version.

**After Deployment:**
1. Test landing page on live URL
2. Test dashboard on live URL
3. Test subscription creation flow
4. Monitor error logs for issues

### 5.3 Set Up Monitoring

1. Enable error tracking (e.g., Sentry, LogRocket)
2. Set up uptime monitoring
3. Configure email alerts for critical errors
4. Monitor Stripe webhook delivery

---

## STEP 6: LAUNCH EXECUTION

### Week 1: Soft Launch (Dec 9-15)

**Monday Dec 9:**
- [ ] Announce soft launch on social media
- [ ] Send invitations to 20-30 early users
- [ ] Monitor Stripe for test transactions
- [ ] Check for any critical bugs

**Tuesday-Friday:**
- [ ] Respond to all support emails within 24 hours
- [ ] Collect feedback on pricing and features
- [ ] Fix any reported bugs immediately
- [ ] Monitor conversion rate

**Daily (15 minutes):**
- Check Stripe dashboard
- Respond to support emails
- Monitor server health

**Weekly Review (30 minutes):**
- Analyze soft launch metrics
- Refine messaging based on feedback
- Plan public launch

### Week 2-3: Public Launch (Dec 16-22)

**Monday Dec 16:**
- [ ] Post announcement across all social channels
- [ ] Send press release to betting forums
- [ ] Monitor Stripe closely
- [ ] Update website with launch announcement

**Tuesday-Friday:**
- [ ] Daily social media posts
- [ ] Reddit engagement
- [ ] Facebook group participation
- [ ] Email outreach
- [ ] Respond to inquiries within 2 hours

**Daily (30 minutes):**
- Monitor Stripe
- Post on social media
- Respond to support emails
- Check server health

**Weekly Review (1.5 hours):**
- Analyze launch week metrics
- Adjust marketing strategy
- Plan next week

### Week 4: Growth & Optimization (Dec 23-29)

**Holiday Period:**
- Expect lower signups
- Maintain systems
- Respond to support
- Prepare January plan

**Daily (15 minutes):**
- Monitor Stripe and analytics
- Respond to support
- Maintain social media
- Check server health

**Weekly Review (1 hour):**
- Analyze December metrics
- Prepare January strategy

---

## STEP 7: ONGOING MAINTENANCE

### Daily (5-10 minutes)
- Check Stripe dashboard for new signups
- Review support emails
- Monitor server health
- Post on social media (1 post)

### Weekly (1 hour)
- Respond to all support emails
- Analyze metrics (signups, revenue, churn)
- Post on social media (3-5 posts)
- Engage in forums/communities
- Review and fix any bugs

### Monthly (2-3 hours)
- Analyze full month's data
- Calculate MRR and growth rate
- Review customer feedback
- Adjust marketing strategy
- Plan next month's focus

---

## TROUBLESHOOTING

### Issue: Stripe keys not working

**Solution:**
1. Verify keys are in environment variables
2. Check that you're using live keys (not test keys)
3. Verify keys are not accidentally truncated
4. Test with a simple API call to Stripe
5. Contact Stripe support if keys are invalid

### Issue: Subscriptions not being created

**Solution:**
1. Check that Stripe keys are configured
2. Verify database tables exist
3. Check server logs for error messages
4. Test with Stripe test card
5. Verify customer is being created in Stripe dashboard

### Issue: Payment not processing

**Solution:**
1. Check Stripe dashboard for failed transactions
2. Verify card details are correct
3. Check that customer has sufficient funds
4. Review Stripe logs for specific error
5. Contact Stripe support if issue persists

### Issue: Users can't access dashboard

**Solution:**
1. Verify user is signed in
2. Check that authentication is working
3. Verify database connection
4. Check server logs for errors
5. Clear browser cache and try again

---

## MARKETING EXECUTION

### Facebook Groups (30 minutes/week)
- Join 3-5 relevant groups
- Post 2-3 times per week with genuine value
- Respond to comments and questions
- Share success stories from users

### Reddit (20 minutes/week)
- Comment on relevant posts 3-4 times per week
- Share insights and predictions
- Answer questions about horse racing
- Participate authentically

### Email Outreach (30 minutes/week)
- Send 10-20 personalized emails
- Offer free trial or discount
- Share specific prediction examples
- Follow up with interested prospects

### Content Marketing (1 hour/week)
- Write 1 blog post per week
- Optimize for SEO
- Share on social media
- Link from relevant forums

---

## SUCCESS METRICS

**Track These Weekly:**
- Total signups (cumulative)
- Paid conversions
- Revenue (MRR)
- Churn rate
- Top traffic sources

**Success Targets:**
- Week 2: 5-10 signups
- Week 4: 15-25 signups
- January 31: 40-50 total subscribers
- January MRR: NZ$2,000+

---

## SUPPORT & HELP

If you encounter issues:

1. **Check the error logs:** Server errors are logged to console
2. **Review Stripe dashboard:** Payment issues show up there
3. **Test with test cards:** Use Stripe test mode before going live
4. **Check environment variables:** Ensure all secrets are configured
5. **Verify database:** Make sure tables exist and are connected

For technical issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

---

## NEXT STEPS

1. **Configure Stripe keys** (today)
2. **Test landing page and dashboard** (today)
3. **Deploy to production** (tomorrow)
4. **Execute soft launch** (Dec 9)
5. **Execute public launch** (Dec 16)
6. **Monitor and optimize** (ongoing)

**Timeline to First Revenue:** 2-3 weeks  
**Timeline to NZ$2,000 MRR:** 6-8 weeks

Good luck with your launch! 🚀
