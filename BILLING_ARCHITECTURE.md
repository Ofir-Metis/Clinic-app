# 🏥 Clinic Management System - Israeli Billing Architecture

## Overview

This document outlines the comprehensive billing architecture for the Israeli coaching platform, designed to handle dual payment flows:

1. **SaaS Subscriptions**: Platform fees from coaches to the clinic management system
2. **Client-to-Therapist Payments**: Session payments from clients to individual therapists

The system is fully compliant with Israeli VAT law, CTC (Continuous Transaction Controls), and supports multiple Israeli payment processors.

## 🏛️ Israeli Compliance Requirements

### VAT Compliance (2025)
- **VAT Rate**: 18% (effective January 1, 2025)
- **CTC Threshold**: 20,000 NIS (~$5,200 USD) excluding VAT (as of 2025)
- **Allocation Numbers**: Required from Israeli Tax Authority (ITA) for B2B invoices above threshold
- **SHAAM System**: Real-time invoice clearance with ITA
- **Retention**: 7 years minimum for all financial records

### Key Compliance Features
- Real-time CTC integration with Israeli Tax Authority
- Automatic VAT calculation and reporting
- Proper invoice allocation number management
- Electronic invoice data submission
- Audit trail for all transactions

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BILLING SYSTEM ARCHITECTURE                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   SaaS Billing  │    │ Client-Therapist│                    │
│  │   (Coaches →    │    │    Payments     │                    │
│  │    Platform)    │    │ (Clients → Docs)│                    │
│  └─────────────────┘    └─────────────────┘                    │
│           │                       │                             │
│           └───────┬───────────────┘                             │
│                   │                                             │
│           ┌──────────────────┐                                  │
│           │  Billing Engine  │                                  │
│           │  - Invoice Gen   │                                  │
│           │  - VAT Calc      │                                  │
│           │  - CTC Compliance│                                  │
│           └──────────────────┘                                  │
│                   │                                             │
│           ┌──────────────────┐                                  │
│           │Payment Processors│                                  │
│           │ - Tranzilla      │                                  │
│           │ - Cardcom        │                                  │
│           │ - Isracard       │                                  │
│           │ - International  │                                  │
│           └──────────────────┘                                  │
│                   │                                             │
│           ┌──────────────────┐                                  │
│           │  Tax Compliance  │                                  │
│           │ - ITA Integration│                                  │
│           │ - CTC Clearance  │                                  │
│           │ - VAT Reporting  │                                  │
│           └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 💰 Revenue Models

### 1. SaaS Subscription Model (Platform Revenue)

**Subscription Tiers for Coaches:**

| Plan | Monthly Fee (NIS) | Monthly Fee (USD) | Features |
|------|------------------|-------------------|----------|
| **Starter** | ₪180 | $50 | Up to 20 clients, basic scheduling |
| **Professional** | ₪360 | $100 | Up to 50 clients, advanced analytics |
| **Enterprise** | ₪540 | $150 | Unlimited clients, full features |
| **Premium** | ₪900 | $250 | White-label, API access, priority support |

**Billing Cycle Options:**
- Monthly billing
- Quarterly billing (5% discount)
- Annual billing (10% discount)
- Custom enterprise contracts

### 2. Client-to-Therapist Payment Model

**Flexible Pricing Structure:**
- **Per-session pricing**: ₪200-800 ($55-220) per session
- **Package deals**: 4, 8, or 12 session packages with discounts
- **Subscription therapy**: Monthly unlimited or limited session plans
- **Group sessions**: Reduced per-person rates
- **Custom pricing**: Therapist-defined rates per client

**Platform Commission:**
- 3.5% transaction fee on client payments to therapists
- Reduced to 2.5% for Premium plan subscribers
- Direct bank transfer option (higher fee 4.5%)

## 🏦 Payment Processing Integration

### Primary Israeli Processors

#### 1. Tranzilla
```json
{
  "processor": "tranzilla",
  "fees": {
    "credit_card": "1.01%",
    "small_business": "1.49%",
    "large_business": "0.84%"
  },
  "supported_cards": ["Visa", "Mastercard", "Isracard", "Diners"],
  "settlement": "T+1",
  "integration": "RESTful API"
}
```

#### 2. Cardcom
```json
{
  "processor": "cardcom",
  "fees": {
    "standard": "1.1%",
    "volume_discount": "0.9%"
  },
  "features": ["recurring_billing", "tokenization", "fraud_protection"],
  "settlement": "T+1"
}
```

#### 3. Isracard Direct
```json
{
  "processor": "isracard",
  "market_share": "50%",
  "fees": {
    "standard": "1.2%",
    "negotiated": "0.95%"
  },
  "features": ["split_payments", "marketplace_support"]
}
```

### International Processors (for Global Coaches)

#### Stripe (Primary International)
```json
{
  "processor": "stripe",
  "fees": {
    "israeli_cards": "2.9% + ₪1.20",
    "international": "3.4% + ₪1.20"
  },
  "features": ["multi_currency", "subscription_management", "tax_calculation"]
}
```

## 🧮 Tax Calculation Engine

### VAT Implementation
```typescript
interface VATCalculation {
  baseAmount: number;
  vatRate: number; // 18% as of 2025
  vatAmount: number;
  totalAmount: number;
  exemptionReason?: string;
  customerType: 'individual' | 'business' | 'npo';
}

interface CTCRequirement {
  invoiceAmount: number;
  thresholdAmount: number; // 20,000 NIS as of 2025
  requiresCTC: boolean;
  allocationNumber?: string;
  submissionStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
}
```

### CTC Integration Flow
1. **Invoice Creation**: Generate invoice with all required fields
2. **Threshold Check**: Determine if CTC is required (>20,000 NIS)
3. **ITA Submission**: Submit to SHAAM system if required
4. **Allocation Number**: Receive and store allocation number
5. **Invoice Finalization**: Complete invoice with allocation number
6. **Customer Delivery**: Send compliant invoice to customer

## 🗄️ Database Schema

### Core Billing Tables

```sql
-- Subscription Plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly_nis DECIMAL(10,2) NOT NULL,
    price_monthly_usd DECIMAL(10,2) NOT NULL,
    features JSONB NOT NULL,
    max_clients INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Coach Subscriptions
CREATE TABLE coach_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, suspended, past_due
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, quarterly, annual
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    currency VARCHAR(3) DEFAULT 'ILS',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Invoices
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES coach_subscriptions(id),
    coach_id UUID NOT NULL REFERENCES users(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal_nis DECIMAL(10,2) NOT NULL,
    vat_amount_nis DECIMAL(10,2) NOT NULL,
    total_amount_nis DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ILS',
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    
    -- Israeli Compliance
    requires_ctc BOOLEAN DEFAULT false,
    ctc_allocation_number VARCHAR(100),
    ctc_submission_status VARCHAR(50), -- pending, submitted, approved, rejected
    vat_rate DECIMAL(5,4) DEFAULT 0.18,
    
    -- Payment Processing
    payment_processor VARCHAR(50),
    processor_transaction_id VARCHAR(255),
    processor_fee_nis DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Client Payments to Therapists
CREATE TABLE client_therapist_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id),
    therapist_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    
    -- Payment Details
    amount_nis DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ILS',
    payment_type VARCHAR(50) NOT NULL, -- session, package, subscription
    description TEXT,
    
    -- Platform Commission
    platform_commission_rate DECIMAL(5,4) NOT NULL,
    platform_commission_nis DECIMAL(10,2) NOT NULL,
    therapist_payout_nis DECIMAL(10,2) NOT NULL,
    
    -- Payment Processing
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_method VARCHAR(50), -- credit_card, bank_transfer, cash
    payment_processor VARCHAR(50),
    processor_transaction_id VARCHAR(255),
    processor_fee_nis DECIMAL(10,2),
    
    -- Israeli Compliance
    requires_receipt BOOLEAN DEFAULT true,
    receipt_number VARCHAR(100),
    vat_included BOOLEAN DEFAULT true,
    vat_rate DECIMAL(5,4) DEFAULT 0.18,
    
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Therapist Pricing Rules
CREATE TABLE therapist_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES users(id),
    client_id UUID REFERENCES users(id), -- null for default pricing
    
    -- Pricing Structure
    session_price_nis DECIMAL(10,2),
    package_4_price_nis DECIMAL(10,2),
    package_8_price_nis DECIMAL(10,2),
    package_12_price_nis DECIMAL(10,2),
    monthly_subscription_nis DECIMAL(10,2),
    
    -- Special Conditions
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    minimum_notice_hours INTEGER DEFAULT 24,
    cancellation_fee_nis DECIMAL(10,2),
    
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Israeli Tax Compliance
CREATE TABLE tax_compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- subscription_invoice, client_payment, therapist_payout
    entity_id UUID NOT NULL,
    
    -- CTC Information
    requires_ctc BOOLEAN NOT NULL,
    ctc_threshold_nis DECIMAL(10,2) DEFAULT 20000,
    allocation_number VARCHAR(100),
    submission_timestamp TIMESTAMP,
    ita_response JSONB,
    
    -- VAT Information
    vat_rate DECIMAL(5,4) NOT NULL,
    vat_amount_nis DECIMAL(10,2) NOT NULL,
    vat_exemption_reason VARCHAR(255),
    
    -- Audit Trail
    compliance_status VARCHAR(50) DEFAULT 'pending', -- pending, compliant, non_compliant, under_review
    last_verification_date TIMESTAMP,
    verification_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Processing Integration
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- subscription, client_payment
    entity_id UUID NOT NULL,
    
    -- Transaction Details
    amount_nis DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ILS',
    processor VARCHAR(50) NOT NULL, -- tranzilla, cardcom, isracard, stripe
    processor_transaction_id VARCHAR(255) UNIQUE,
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled, refunded
    failure_reason TEXT,
    
    -- Processing Details
    processing_fee_nis DECIMAL(10,2),
    net_amount_nis DECIMAL(10,2),
    processed_at TIMESTAMP,
    settled_at TIMESTAMP,
    
    -- Security
    payment_method_token VARCHAR(255), -- tokenized payment method
    fraud_score DECIMAL(3,2),
    risk_assessment JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_coach_subscriptions_coach_status ON coach_subscriptions(coach_id, status);
CREATE INDEX idx_subscription_invoices_coach_status ON subscription_invoices(coach_id, status);
CREATE INDEX idx_client_payments_therapist_date ON client_therapist_payments(therapist_id, payment_date);
CREATE INDEX idx_client_payments_client_date ON client_therapist_payments(client_id, payment_date);
CREATE INDEX idx_tax_compliance_entity ON tax_compliance_records(entity_type, entity_id);
CREATE INDEX idx_payment_transactions_entity ON payment_transactions(entity_type, entity_id);
CREATE INDEX idx_therapist_pricing_active ON therapist_pricing(therapist_id, is_active, effective_from, effective_until);
```

## 🔧 Service Architecture

### Billing Service Structure
```
services/
├── billing-service/                 # Core billing orchestration (port 3009)
│   ├── subscription-management/     # SaaS subscription handling
│   ├── client-payments/            # Client-to-therapist payments
│   ├── invoice-generation/         # Invoice creation and management
│   └── pricing-engine/             # Dynamic pricing calculations
├── payment-processing-service/      # Payment processor integration (port 3010)
│   ├── tranzilla-integration/      # Israeli processor
│   ├── cardcom-integration/        # Israeli processor
│   ├── stripe-integration/         # International processor
│   └── fraud-detection/            # Security and fraud prevention
├── tax-compliance-service/          # Israeli tax compliance (port 3011)
│   ├── vat-calculation/            # VAT computation
│   ├── ctc-integration/            # ITA SHAAM system integration
│   ├── invoice-clearance/          # CTC clearance workflow
│   └── audit-reporting/            # Compliance reporting
└── financial-reporting-service/     # Analytics and reporting (port 3012)
    ├── revenue-analytics/          # Revenue insights
    ├── payout-management/          # Therapist payouts
    ├── tax-reporting/              # Tax report generation
    └── compliance-monitoring/      # Ongoing compliance checks
```

## 🎯 Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
1. Set up billing service with database schema
2. Implement basic subscription management
3. Create invoice generation system
4. Build payment processor abstraction layer

### Phase 2: Israeli Compliance (Weeks 3-4)
1. VAT calculation engine
2. CTC threshold checking
3. Basic ITA integration for allocation numbers
4. Compliance audit trail

### Phase 3: Payment Processing (Weeks 5-6)
1. Tranzilla integration (primary Israeli)
2. Stripe integration (international backup)
3. Fraud detection and security measures
4. Payment retry logic and failed payment handling

### Phase 4: Advanced Features (Weeks 7-8)
1. Client-to-therapist payment flows
2. Dynamic pricing engine for therapists
3. Advanced reporting and analytics
4. Automated compliance monitoring

### Phase 5: Admin & Therapist Dashboards (Weeks 9-10)
1. Admin subscription management interface
2. Therapist payment dashboard
3. Financial reporting interface
4. Compliance monitoring dashboard

## 💡 Recommended Implementation Strategy

### Build vs. Buy Analysis

**Recommendation: Hybrid Approach**

1. **Core Billing Logic**: Build in-house for maximum control
2. **Payment Processing**: Integrate with established providers (Tranzilla + Stripe)
3. **Tax Compliance**: Build CTC integration, consider partnering with Israeli tax compliance service
4. **Subscription Management**: Build lightweight version, consider upgrading to Chargebee for complex needs

### Technology Stack
- **Backend**: NestJS with TypeORM (consistent with existing architecture)
- **Database**: PostgreSQL with dedicated billing schema
- **Queue**: Redis Bull for payment processing
- **Monitoring**: Custom alerts for payment failures and compliance issues
- **Security**: JWT + 2FA for financial operations

### Key Success Metrics
- Payment success rate >99%
- CTC compliance rate 100%
- Average payment processing time <3 seconds
- Therapist payout accuracy 100%
- Tax compliance audit readiness

---

This architecture provides a robust foundation for Israeli-compliant billing while maintaining flexibility for future expansion and international markets.