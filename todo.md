# Equine Oracle API - Deployment & Feature Tracking

## Phase 1: Backend API Integration
- [x] Initialize full-stack web project (tRPC + React + Express)
- [x] Integrate LightGBM Ranker model into the project
- [x] Integrate scaler and feature columns into the project
- [x] Create Python helper module for model inference
- [x] Update tRPC procedures to use actual model predictions
- [x] Create tRPC procedure for betting signals
- [ ] Test model inference with sample data

## Phase 2: Database Schema & API Keys
- [ ] Design API key management table in Drizzle schema
- [ ] Design prediction history table for analytics
- [ ] Design user subscription/tier table
- [ ] Implement API key generation and validation procedures
- [ ] Create database migrations

## Phase 3: Frontend UI
- [ ] Create prediction input form component
- [ ] Create prediction results display component
- [ ] Create API key management dashboard
- [ ] Create usage analytics dashboard
- [ ] Create documentation page

## Phase 4: Authentication & Authorization
- [ ] Set up OAuth integration (already in template)
- [ ] Implement API key authentication for external clients
- [ ] Create admin role for API key management
- [ ] Implement rate limiting for API endpoints

## Phase 5: Deployment & Testing
- [ ] Test prediction API with sample data
- [ ] Test API key authentication flow
- [ ] Create integration tests for tRPC procedures
- [ ] Deploy to permanent URL
- [ ] Set up monitoring and logging

## Phase 6: Documentation & Launch
- [ ] Create API documentation
- [ ] Create user guide for dashboard
- [ ] Create deployment guide
- [ ] Launch public API


## Phase 7: Betting Confidence & Signals
- [x] Create confidence scoring system based on model predictions
- [x] Implement betting signal generation (when to place bets)
- [x] Create tRPC procedure for betting signals endpoint
- [x] Create betting strategy guide document
- [x] Add confidence threshold configuration
- [ ] Create betting history tracking table
- [ ] Build betting signals dashboard

## Phase 8: Advanced Ensemble Architecture
- [x] Integrate meta-ensemble architecture (4 ranker models)
- [x] Implement weighted ensemble strategy
- [x] Create ensemble prediction service
- [x] Add metrics calculator and performance monitoring
- [x] Implement auto-retraining engine
- [ ] Integrate live data API (TAB NZ)
- [ ] Deploy continuous retraining pipeline


## Phase 9: Monetization System (NEW)
- [x] Design monetization strategy (pricing tiers, revenue model)
- [x] Create pricing strategy document (MONETIZATION_STRATEGY.md)
- [x] Define subscription tiers (Basic, Pro, API Starter, API Professional)
- [x] Create revenue projections (conservative, moderate, optimistic)
- [x] Extend database schema with subscription tables
- [x] Create API keys table for programmatic access
- [x] Create API usage tracking table
- [x] Create billing records table
- [x] Run database migrations (pnpm db:push)
- [x] Create Stripe service integration (stripe_service.ts)
- [x] Implement Stripe customer creation
- [x] Implement subscription creation and cancellation
- [x] Implement billing portal access
- [x] Create API key generation service
- [x] Add database helper functions for subscriptions
- [x] Add database helper functions for API keys
- [x] Add database helper functions for usage tracking
- [x] Add database helper functions for billing records
- [x] Create subscription router with getTiers, getStatus, create, cancel procedures
- [x] Create API key router with list, create, revoke procedures
- [x] Create landing page with hero section (Home.tsx)
- [x] Add feature cards to landing page
- [x] Add pricing tier cards to landing page
- [x] Create dashboard page (Dashboard.tsx)
- [x] Implement subscription management tab
- [x] Implement API key management tab
- [x] Add subscription tier selection UI
- [x] Add billing portal access button
- [x] Add API key creation form
- [x] Add API key list and revocation
- [x] Add responsive design for mobile/tablet
- [x] Update App.tsx with new routes
- [x] Create monetization strategy document
- [x] Create launch playbook with week-by-week execution
- [x] Create implementation guide for independent setup
- [x] Create comprehensive README for monetization system
- [ ] Test landing page layout and responsiveness
- [ ] Test dashboard authentication and access
- [ ] Test subscription tier display
- [ ] Test API key generation flow
- [ ] Test API key revocation
- [ ] Test database operations
- [ ] Test tRPC procedures with test data
- [ ] Verify Stripe integration (when keys configured)
- [ ] Test payment flow with Stripe test cards
- [ ] Test webhook handling
- [ ] Verify email notifications
- [ ] Test error handling and edge cases
- [ ] Configure Stripe API keys in environment
- [ ] Implement Stripe Checkout flow
- [ ] Set up webhook endpoint for Stripe events
- [ ] Test subscription creation with real Stripe
- [ ] Test payment processing
- [ ] Verify customer creation in Stripe
- [ ] Test billing portal access
- [ ] Verify invoice generation
- [ ] Deploy to production
- [ ] Verify all systems working on live URL
- [ ] Monitor error logs
- [ ] Execute soft launch (Week 2)
- [ ] Collect early user feedback
- [ ] Fix any reported bugs
- [ ] Execute public launch (Week 3)
- [ ] Monitor Stripe transactions
- [ ] Track signup metrics
- [ ] Monitor server health

## Monetization Success Milestones
- [ ] Week 2 (Dec 9-15): 5-10 signups from soft launch
- [ ] Week 4 (Dec 16-22): 15-25 total signups
- [ ] January 31: 40-50 total subscribers
- [ ] January 31: NZ$2,000+ MRR
- [ ] February: Clear path to NZ$5,000+ MRR
