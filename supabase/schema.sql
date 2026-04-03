-- ============================================
-- GETEDIL-OS PRODUCTION SCHEMA
-- Ethiopian Super-App with 27-Pillar Ecosystem
-- Version: 1.0.0
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================
-- 1. CORE PROFILES TABLE (Linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE,
    government_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    amharic_name TEXT,
    date_of_birth DATE,
    region TEXT,
    city TEXT,
    sub_city TEXT,
    woreda TEXT,
    profile_picture_url TEXT,
    cover_photo_url TEXT,
    bio TEXT,
    trust_score DECIMAL(5,2) DEFAULT 0.00,
    trust_level INTEGER DEFAULT 1, -- 1-10
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    device_id TEXT,
    fcm_token TEXT,
    language_preference TEXT DEFAULT 'am',
    theme_preference TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_profiles_phone (phone_number),
    INDEX idx_profiles_referral (referral_code),
    INDEX idx_profiles_trust_score (trust_score DESC)
);

-- ============================================
-- 2. KYC VERIFICATIONS (P3_GetVerified)
-- ============================================
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('national_id', 'passport', 'drivers_license', 'voter_card', 'tax_id')),
    document_number TEXT NOT NULL,
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    selfie_url TEXT,
    additional_documents JSONB DEFAULT '[]',
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'processing', 'verified', 'rejected', 'expired')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    expiry_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, verification_type),
    INDEX idx_kyc_status (verification_status),
    INDEX idx_kyc_user (user_id)
);

-- ============================================
-- 3. WALLET SYSTEM (CRDT-Ready)
-- ============================================
CREATE TABLE public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    reserved_balance DECIMAL(15,2) DEFAULT 0.00, -- For pending transactions
    currency TEXT DEFAULT 'ETB',
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit DECIMAL(15,2) DEFAULT 50000.00,
    monthly_limit DECIMAL(15,2) DEFAULT 500000.00,
    daily_used DECIMAL(15,2) DEFAULT 0.00,
    monthly_used DECIMAL(15,2) DEFAULT 0.00,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 1 -- For CRDT vector clock
);

-- CRDT-Ready Transactions Table
CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT UNIQUE NOT NULL, -- Client-generated ID for idempotency
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'fee', 'bonus')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed', 'conflict')),
    payment_method TEXT CHECK (payment_method IN ('telebirr', 'cbe_birr', 'bank_transfer', 'card', 'cash', 'internal')),
    counterparty_id UUID REFERENCES public.profiles(id),
    counterparty_type TEXT CHECK (counterparty_type IN ('user', 'business', 'system')),
    
    -- CRDT Fields for LWW-Element-Set
    client_id TEXT NOT NULL, -- Device/client identifier
    timestamp BIGINT NOT NULL, -- Unix timestamp in milliseconds
    vector_clock JSONB NOT NULL DEFAULT '{}', -- {client_id: counter}
    operation_id TEXT UNIQUE NOT NULL, -- {client_id}:{timestamp}:{counter}
    is_tombstone BOOLEAN DEFAULT FALSE, -- For deletion sets
    
    -- Business context
    pillar_id TEXT, -- Which pillar triggered this (P4_GetHired, P6_GetPaid, etc)
    reference_id TEXT, -- Job ID, Order ID, etc
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Reconciliation
    reconciled_at TIMESTAMPTZ,
    conflict_resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_transactions_user (user_id, created_at DESC),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_client (client_id, operation_id),
    INDEX idx_transactions_vector (vector_clock),
    INDEX idx_transactions_reference (reference_id),
    INDEX idx_transactions_date (created_at DESC)
);

-- ============================================
-- 4. JOB MARKETPLACE (P4_GetHired, P14_GetHiredPlus)
-- ============================================
CREATE TABLE public.job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    title_am TEXT,
    description TEXT NOT NULL,
    description_am TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'freelance', 'internship', 'gig')),
    experience_level TEXT CHECK (experience_level IN ('entry', 'intermediate', 'senior', 'expert')),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    salary_currency TEXT DEFAULT 'ETB',
    is_salary_negotiable BOOLEAN DEFAULT FALSE,
    location TEXT,
    is_remote BOOLEAN DEFAULT FALSE,
    application_deadline DATE,
    required_skills TEXT[],
    preferred_skills TEXT[],
    required_documents TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE, -- P14_GetHiredPlus
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'filled', 'expired', 'archived')),
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_jobs_status (status, created_at DESC),
    INDEX idx_jobs_employer (employer_id),
    INDEX idx_jobs_category (category),
    INDEX idx_jobs_deadline (application_deadline),
    INDEX idx_jobs_search USING GIN(to_tsvector('english', title || ' ' || description))
);

-- Job Applications
CREATE TABLE public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id),
    cover_letter TEXT,
    expected_salary DECIMAL(10,2),
    availability_date DATE,
    attachments JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn')),
    employer_notes TEXT,
    score DECIMAL(5,2), -- AI matching score
    interviewed_at TIMESTAMPTZ,
    offered_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(job_id, applicant_id),
    INDEX idx_applications_job (job_id, status),
    INDEX idx_applications_applicant (applicant_id, created_at DESC)
);

-- ============================================
-- 5. 27 PILLARS REGISTRY (Dynamic Ecosystem)
-- ============================================
CREATE TABLE public.pillars_registry (
    id TEXT PRIMARY KEY, -- P0_Onboarding, P1_GetConsultancy, etc
    name TEXT NOT NULL,
    name_am TEXT,
    description TEXT,
    version TEXT DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    required_kyc_level INTEGER DEFAULT 0,
    icon_url TEXT,
    configuration JSONB DEFAULT '{}',
    dependencies TEXT[], -- Array of pillar IDs this depends on
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Pillar Access
CREATE TABLE public.user_pillar_access (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pillar_id TEXT REFERENCES public.pillars_registry(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    PRIMARY KEY (user_id, pillar_id)
);

-- ============================================
-- 6. OFFLINE SYNC METADATA (CRDT Support)
-- ============================================
CREATE TABLE public.sync_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    last_vector_clock JSONB DEFAULT '{}',
    pending_operations INTEGER DEFAULT 0,
    failed_operations INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'conflict', 'error')),
    device_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_id, user_id),
    INDEX idx_sync_user (user_id, last_sync_at DESC)
);

-- ============================================
-- 7. NOTIFICATIONS & FEED
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    title_am TEXT,
    body TEXT,
    body_am TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_notifications_user (user_id, created_at DESC, is_read)
);

-- ============================================
-- 8. AUDIT LOGS (Compliance)
-- ============================================
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    pillar_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_audit_user (user_id, created_at DESC),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_action (action, created_at DESC)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillars_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pillar_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read any profile but only update their own
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- WALLETS: Users can only see their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update wallet" ON public.wallets
    FOR UPDATE USING (true);

-- TRANSACTIONS: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- JOB LISTINGS: Anyone can view active jobs
CREATE POLICY "Anyone can view active jobs" ON public.job_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Employers can manage own jobs" ON public.job_listings
    FOR ALL USING (auth.uid() = employer_id);

-- JOB APPLICATIONS: Applicants see their own, employers see applications to their jobs
CREATE POLICY "Applicants view own applications" ON public.job_applications
    FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Employers view applications to their jobs" ON public.job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.job_listings
            WHERE id = job_applications.job_id
            AND employer_id = auth.uid()
        )
    );

CREATE POLICY "Users can apply to jobs" ON public.job_applications
    FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- SYNC METADATA: Users can only see their own sync data
CREATE POLICY "Users manage own sync metadata" ON public.sync_metadata
    FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS: Users only see their own
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.job_listings
    FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Auto-create wallet when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, full_name, phone_number, referral_code)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone_number',
        encode(gen_random_bytes(6), 'hex')
    );
    
    -- Create wallet
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id);
    
    -- Grant access to basic pillars
    INSERT INTO public.user_pillar_access (user_id, pillar_id)
    SELECT NEW.id, id FROM public.pillars_registry
    WHERE is_premium = FALSE AND is_active = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Validate transaction before insert (prevent double-spending)
CREATE OR REPLACE FUNCTION public.validate_transaction()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(15,2);
BEGIN
    IF NEW.type = 'debit' THEN
        -- Check if sufficient balance
        SELECT balance INTO current_balance FROM public.wallets WHERE user_id = NEW.user_id;
        
        IF current_balance < NEW.amount THEN
            RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', current_balance, NEW.amount;
        END IF;
        
        -- Check if transaction already processed (idempotency)
        IF EXISTS (
            SELECT 1 FROM public.wallet_transactions 
            WHERE transaction_id = NEW.transaction_id 
            AND status = 'completed'
        ) THEN
            RAISE EXCEPTION 'Duplicate transaction detected: %', NEW.transaction_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_before_insert
    BEFORE INSERT ON public.wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION public.validate_transaction();

-- ============================================
-- INITIAL DATA: 27 PILLARS REGISTRY
-- ============================================
INSERT INTO public.pillars_registry (id, name, name_am, is_premium, required_kyc_level) VALUES
('P0_Onboarding', 'Onboarding & First-Time UX', 'የመጀመሪያ ተሞክሮ', FALSE, 0),
('P1_GetConsultancy', 'Business Consultancy', 'የንግድ ማማከር', FALSE, 1),
('P2_GetHome', 'Real Estate & Housing', 'ሪል እስቴት', FALSE, 1),
('P3_GetVerified', 'Identity & KYC', 'ማንነት ማረጋገጫ', FALSE, 0),
('P4_GetHired', 'Job Marketplace', 'የስራ ገበያ', FALSE, 0),
('P5_GetSkills', 'Education & Skills', 'ትምህርት እና ክህሎት', FALSE, 0),
('P6_GetPaid', 'Payments & Wallet', 'ክፍያ እና ቦርሳ', FALSE, 1),
('P7_GetConnected', 'Social Network', 'ማህበራዊ ትስስር', FALSE, 0),
('P8_GetCreated', 'Creator Studio', 'ፈጣሪ ስቱዲዮ', FALSE, 1),
('P9_GetTraded', 'Marketplace', 'ገበያ', FALSE, 1),
('P10_GetDiaspora', 'Diaspora Services', 'ዲያስፖራ አገልግሎት', FALSE, 1),
('P11_GetTender', 'Government Tenders', 'መንግስታዊ ጨረታ', TRUE, 2),
('P12_GetLegal', 'Legal Services', 'ህጋዊ አገልግሎት', TRUE, 2),
('P13_GetDelivery', 'Logistics & Delivery', 'ሎጅስቲክስ', FALSE, 1),
('P14_GetHiredPlus', 'Premium Jobs', 'ፕሪሚየም ስራዎች', TRUE, 2),
('P15_GetShopping', 'E-commerce', 'ኢ-ኮሜርስ', FALSE, 1),
('P16_GetSelling', 'Seller Dashboard', 'ሻጭ ዳሽቦርድ', FALSE, 2),
('P17_GetPaidPlus', 'Premium Payments', 'ፕሪሚየም ክፍያ', TRUE, 2),
('P18_GetConnectedPlus', 'Premium Social', 'ፕሪሚየም ማህበራዊ', TRUE, 1),
('P19_GetProfiled', 'Advanced Profile', 'የላቀ ፕሮፋይል', FALSE, 1),
('P20_GetAdmin', 'Admin Dashboard', 'አስተዳዳሪ', TRUE, 3),
('P21_GetAPI', 'Developer API', 'ዲቨሎፐር ኤፒአይ', TRUE, 2),
('P22_GetLocal', 'Localization Hub', 'አካባቢያዊ ማዕከል', FALSE, 0),
('P23_GetPlans', 'Subscription Plans', 'የደንበኝነት ዕቅዶች', FALSE, 0),
('P24_GetReferral', 'Referral Program', 'ማመሳከሪያ', FALSE, 0),
('P25_GetNotified', 'Notification Center', 'ማሳወቂያ', FALSE, 0),
('P26_GetReporting', 'Analytics & Reports', 'ትንተና', TRUE, 1),
('P27_GetAutomated', 'Automation Hub', 'አውቶሜሽን', TRUE, 2);
