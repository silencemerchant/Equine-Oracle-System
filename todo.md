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
