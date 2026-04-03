-- ============================================
-- GETEDIL-OS MASTER PRODUCTION SCHEMA (FULL)
-- Location: /supabase/schema.sql
-- Optimized for: PostgreSQL / Supabase
-- ============================================

-- 1. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- 2. CORE IDENTITY (P3_GetVerified / P19_GetProfiled)
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
    bio TEXT,
    trust_score DECIMAL(5,2) DEFAULT 0.00,
    trust_level INTEGER DEFAULT 1,
    is_verified BOOLEAN DEFAULT FALSE,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    language_preference TEXT DEFAULT 'am',
    theme_preference TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FINANCIAL ENGINE (P6_GetPaid / P17_GetPaidPlus)
CREATE TABLE public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00,
    reserved_balance DECIMAL(15,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'ETB',
    is_active BOOLEAN DEFAULT TRUE,
    daily_limit DECIMAL(15,2) DEFAULT 50000.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version BIGINT DEFAULT 1 -- For CRDT Sync
);

CREATE TABLE public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT UNIQUE NOT NULL, -- Client-side ID for idempotency
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'fee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    payment_method TEXT CHECK (payment_method IN ('telebirr', 'chapa', 'cbe_birr', 'internal')),
    pillar_id TEXT, -- Which pillar (e.g., P4_GetHired)
    reference_id TEXT, -- Job ID or Order ID
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JOB MARKETPLACE (P4_GetHired / P14_GetHiredPlus)
CREATE TABLE public.job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'gig')),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    location TEXT,
    is_remote BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. THE 27-PILLAR REGISTRY
CREATE TABLE public.pillars_registry (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_am TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    required_kyc_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES (Optimized for performance)
CREATE INDEX idx_profiles_phone ON public.profiles (phone_number);
CREATE INDEX idx_profiles_referral ON public.profiles (referral_code);
CREATE INDEX idx_transactions_user ON public.wallet_transactions (user_id, created_at DESC);
CREATE INDEX idx_jobs_active ON public.job_listings (status) WHERE status = 'active';

-- 7. TRIGGERS & AUTOMATION
-- Auto-update 'updated_at' column
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
CREATE TRIGGER handle_updated_at_jobs BEFORE UPDATE ON public.job_listings FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Auto-create Profile & Wallet on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number, referral_code)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone_number', encode(gen_random_bytes(6), 'hex'));
    
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INITIAL PILLAR DATA (Full 27)
INSERT INTO public.pillars_registry (id, name, name_am, is_premium) VALUES
('P0_Onboarding', 'Onboarding', 'የመጀመሪያ ተሞክሮ', FALSE),
('P1_GetConsultancy', 'Business Consultancy', 'የንግድ ማማከር', FALSE),
('P2_GetHome', 'Real Estate', 'ሪል እስቴት', FALSE),
('P3_GetVerified', 'Identity & KYC', 'ማንነት ማረጋገጫ', FALSE),
('P4_GetHired', 'Job Marketplace', 'የስራ ገበያ', FALSE),
('P5_GetSkills', 'Education & Skills', 'ትምህርት እና ክህሎት', FALSE),
('P6_GetPaid', 'Payments & Wallet', 'ክፍያ እና ቦርሳ', FALSE),
('P7_GetConnected', 'Social Network', 'ማህበራዊ ትስስር', FALSE),
('P8_GetCreated', 'Creator Studio', 'ፈጣሪ ስቱዲዮ', FALSE),
('P9_GetTraded', 'Marketplace', 'ገበያ', FALSE),
('P10_GetDiaspora', 'Diaspora Services', 'ዲያስፖራ አገልግሎት', FALSE),
('P11_GetTender', 'Government Tenders', 'መንግስታዊ ጨረታ', TRUE),
('P12_GetLegal', 'Legal Services', 'ህጋዊ አገልግሎት', TRUE),
('P13_GetDelivery', 'Logistics', 'ሎጅስቲክስ', FALSE),
('P14_GetHiredPlus', 'Premium Jobs', 'ፕሪሚየም ስራዎች', TRUE),
('P15_GetShopping', 'E-commerce', 'ኢ-ኮሜርስ', FALSE),
('P16_GetSelling', 'Seller Dashboard', 'ሻጭ ዳሽቦርድ', FALSE),
('P17_GetPaidPlus', 'Premium Payments', 'ፕሪሚየም ክፍያ', TRUE),
('P18_GetConnectedPlus', 'Premium Social', 'ፕሪሚየም ማህበራዊ', TRUE),
('P19_GetProfiled', 'Advanced Profile', 'የላቀ ፕሮፋይል', FALSE),
('P20_GetAdmin', 'Admin Dashboard', 'አስተዳዳሪ', TRUE),
('P21_GetAPI', 'Developer API', 'ዲቨሎፐር ኤፒአይ', TRUE),
('P22_GetLocal', 'Localization Hub', 'አካባቢያዊ ማዕከል', FALSE),
('P23_GetPlans', 'Subscription Plans', 'የደንበኝነት ዕቅዶች', FALSE),
('P24_GetReferral', 'Referral Program', 'ማመሳከሪያ', FALSE),
('P25_GetNotified', 'Notification Center', 'ማሳወቂያ', FALSE),
('P26_GetReporting', 'Analytics', 'ትንተና', TRUE),
('P27_GetAutomated', 'Automation Hub', 'አውቶሜሽን', TRUE);
