# LOWKEY CONSULTANTS - Equine Oracle Integration Strategy

**Document Version:** 1.0  
**Date:** November 22, 2025  
**Status:** Integration Planning

---

## EXECUTIVE SUMMARY

This document outlines the integration of LOWKEY CONSULTANTS LIMITED (Company #9384919) as the R&D, startup, and deployment contractor for the Equine Oracle prediction system. The strategy establishes a clear separation between the service delivery entity (LOWKEY) and the product entity (Equine Oracle Limited), enabling both direct revenue generation and future package sales.

---

## BUSINESS STRUCTURE

### Entity Roles

| Entity | Status | Role | Timeline |
|--------|--------|------|----------|
| **LOWKEY CONSULTANTS LIMITED** | Pending Incorporation | R&D, startup, deployment contractor | Dec 5, 2025 |
| **Equine Oracle Limited** | Reserved (not incorporated) | Product company for package sales | TBD (Q1 2026) |
| **Equine Oracle API** | Live (current system) | Initial revenue generation | Now - Jan 2026 |

### Revenue Streams

**Phase 1 (Now - Jan 31, 2026): Direct Revenue**
- Equine Oracle API subscriptions (Basic NZ$29, Pro NZ$79, API tiers NZ$199-499)
- Target: NZ$2,000+ MRR by January 31, 2025
- Billed through current system

**Phase 2 (Feb - June 2026): Package Sales**
- Equine Oracle Limited sells complete prediction system as package
- LOWKEY CONSULTANTS provides deployment and support services
- Revenue split: Product margin + Service fees
- Multi-tenant deployment architecture

**Phase 3 (Q3 2026+): Service Expansion**
- LOWKEY pivots to pentest/red team/paint sec ops services
- Leverages infrastructure built for Equine Oracle
- Maintains Equine Oracle as ongoing revenue stream

---

## MULTI-TENANT ARCHITECTURE

### Current System (Single Tenant)

The current Equine Oracle system is designed for direct B2C sales with:
- Single database per deployment
- Unified user authentication
- Shared infrastructure costs
- Direct Stripe billing

### Proposed Multi-Tenant System

For package sales, implement:

**Database Isolation:**
```
- Separate database per client (logical or physical)
- Client ID in all queries for data isolation
- Shared schema structure across clients
```

**Billing & Licensing:**
```
- License key per client (generated at deployment)
- Usage tracking per client
- Per-client billing configuration
- Deployment tracking and analytics
```

**Deployment Model:**
```
- Containerized deployment (Docker)
- Client-specific configuration
- Automated deployment pipeline
- Monitoring and support dashboard
```

---

## INTEGRATION ROADMAP

### Phase 1: Foundation (Weeks 1-2, Nov 22 - Dec 5)

**Objective:** Establish business structure and create deployment framework

**Tasks:**
1. Extract and analyze deployment package contents
2. Create multi-tenant database schema
3. Build client management system
4. Develop licensing and API key system
5. Create deployment automation scripts
6. Document deployment procedures

**Deliverables:**
- Multi-tenant schema design
- Client management API
- Deployment automation framework
- Deployment documentation

---

### Phase 2: LOWKEY Integration (Weeks 3-4, Dec 6 - Dec 19)

**Objective:** Integrate LOWKEY CONSULTANTS branding and company details

**Tasks:**
1. Add LOWKEY CONSULTANTS company details to system
2. Create white-label configuration
3. Build client onboarding workflow
4. Create deployment guide for LOWKEY team
5. Build client management dashboard
6. Implement usage tracking and analytics

**Deliverables:**
- White-label system configuration
- Client onboarding workflow
- LOWKEY team deployment guide
- Client management dashboard

---

### Phase 3: Package Sales Framework (Weeks 5-6, Dec 20 - Jan 2)

**Objective:** Create framework for selling Equine Oracle as a package

**Tasks:**
1. Create package sales documentation
2. Build licensing system
3. Create deployment checklist
4. Build client support portal
5. Create billing and invoicing system
6. Develop client analytics dashboard

**Deliverables:**
- Package sales documentation
- Licensing system
- Client support portal
- Billing and invoicing system

---

### Phase 4: Real-Time System Integration (Weeks 7-8, Jan 3 - Jan 16)

**Objective:** Integrate RabbitMQ-based real-time prediction system

**Tasks:**
1. Review deployment package microservices
2. Integrate data ingestion service
3. Integrate data enrichment service
4. Integrate automated inference service
5. Integrate prediction storage service
6. Integrate metrics calculation and auto-retraining
7. Test end-to-end feedback loop

**Deliverables:**
- Integrated real-time prediction system
- Microservices deployment guide
- End-to-end test results

---

### Phase 5: Infrastructure for Future Services (Weeks 9-10, Jan 17 - Jan 30)

**Objective:** Establish infrastructure for pentest/red team services

**Tasks:**
1. Design service delivery framework
2. Create service catalog system
3. Build team management system
4. Create engagement tracking system
5. Build reporting and analytics framework
6. Document service delivery procedures

**Deliverables:**
- Service delivery framework
- Service catalog system
- Team management system
- Engagement tracking system

---

## TECHNICAL IMPLEMENTATION

### Multi-Tenant Database Schema

**New Tables:**

```sql
-- Clients table
CREATE TABLE clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  license_key VARCHAR(64) UNIQUE NOT NULL,
  tier VARCHAR(50) NOT NULL,
  status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
  deployment_date TIMESTAMP,
  support_level VARCHAR(50),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Client configurations
CREATE TABLE client_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Usage tracking
CREATE TABLE client_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  metric_name VARCHAR(255),
  metric_value INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Deployments
CREATE TABLE deployments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  deployment_type VARCHAR(50),
  deployment_url VARCHAR(255),
  status VARCHAR(50),
  deployed_at TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

### Licensing System

**License Key Format:**
```
EO-[TIER]-[CLIENT_ID]-[RANDOM_32_CHARS]-[CHECKSUM]
```

**Validation:**
- Check license key format
- Verify client_id matches
- Verify license not expired
- Verify usage within limits
- Return client configuration

### Deployment Automation

**Docker-based deployment:**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install
ENV CLIENT_ID=${CLIENT_ID}
ENV LICENSE_KEY=${LICENSE_KEY}
ENV DATABASE_URL=${DATABASE_URL}
EXPOSE 3000
CMD ["pnpm", "start"]
```

**Deployment script:**
```bash
#!/bin/bash
# Deploy Equine Oracle for a client
CLIENT_ID=$1
LICENSE_KEY=$2
DEPLOYMENT_URL=$3

# Generate configuration
# Build Docker image
# Push to registry
# Deploy to infrastructure
# Configure DNS
# Run health checks
# Notify client
```

---

## LOWKEY CONSULTANTS DETAILS

**Company Name:** LOWKEY CONSULTANTS LIMITED  
**Company Number:** 9384919  
**Entity Type:** NZ Limited Company  
**Incorporation Status:** Pending (Due: December 5, 2025)  
**Application Expiry:** December 5, 2025

**Next Steps:**
1. Sign and return director and shareholder consent forms
2. Complete incorporation process
3. Obtain company registration certificate
4. Set up company bank account
5. Configure tax and GST registration

---

## EQUINE ORACLE LIMITED (RESERVED)

**Company Name:** Equine Oracle Limited  
**Status:** Reserved (not yet incorporated)  
**Planned Incorporation:** Q1 2026  
**Purpose:** Product company for package sales and licensing

**Incorporation Timeline:**
1. Complete LOWKEY CONSULTANTS incorporation (Dec 5, 2025)
2. Establish Equine Oracle Limited (Jan 2026)
3. Transfer product IP to Equine Oracle Limited
4. Begin package sales (Feb 2026)

---

## FUTURE SERVICES - PENTEST/RED TEAM

### Service Offerings

**LOWKEY CONSULTANTS will expand to offer:**

1. **Penetration Testing**
   - Network penetration testing
   - Web application testing
   - Mobile application testing
   - Social engineering assessments

2. **Red Team Operations**
   - Adversarial simulations
   - Threat modeling
   - Incident response exercises
   - Security awareness training

3. **Paint Security Operations**
   - Security infrastructure design
   - Threat detection and response
   - Security operations center (SOC) support
   - Incident response services

### Infrastructure Requirements

**Current Equine Oracle infrastructure can support:**
- Multi-tenant client management
- Usage tracking and analytics
- Billing and invoicing
- Team management
- Engagement tracking
- Reporting and compliance

**Additional infrastructure needed:**
- Service catalog system
- Engagement management system
- Reporting framework
- Compliance tracking
- Client portal enhancements

---

## TIMELINE SUMMARY

| Date | Milestone | Status |
|------|-----------|--------|
| Dec 5, 2025 | LOWKEY CONSULTANTS incorporation deadline | Pending |
| Dec 9, 2025 | Equine Oracle soft launch | On track |
| Dec 16, 2025 | Equine Oracle public launch | On track |
| Jan 31, 2026 | NZ$2,000+ MRR target | Target |
| Feb 2026 | Equine Oracle Limited incorporation | Planned |
| Feb 2026 | Package sales begin | Planned |
| Q1 2026 | Pentest/red team infrastructure ready | Planned |
| Q2 2026 | Pentest/red team services launch | Planned |

---

## NEXT ACTIONS

**Immediate (This Week):**
1. Confirm LOWKEY CONSULTANTS incorporation timeline
2. Extract and analyze deployment package
3. Design multi-tenant database schema
4. Begin client management system development

**Short-term (Next 2 Weeks):**
1. Complete multi-tenant architecture
2. Build deployment automation
3. Create licensing system
4. Develop client management dashboard

**Medium-term (Weeks 3-4):**
1. Integrate LOWKEY branding
2. Create package sales documentation
3. Build client onboarding workflow
4. Integrate real-time prediction system

---

## CONTACT & SUPPORT

**LOWKEY CONSULTANTS LIMITED**
- Company Number: 9384919
- Status: Pending Incorporation
- Incorporation Deadline: December 5, 2025

**Equine Oracle System**
- Current Status: Production Ready
- Soft Launch: December 9, 2025
- Public Launch: December 16, 2025

---

**Document Owner:** LOWKEY CONSULTANTS LIMITED  
**Last Updated:** November 22, 2025  
**Next Review:** December 6, 2025
