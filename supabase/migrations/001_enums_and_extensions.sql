-- ============================================================
-- Migration 001: Enums, Extensions
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fuzzy text search on names/titles

-- ============================================================
-- Platform-level role
-- ============================================================
CREATE TYPE platform_role AS ENUM (
    'super_admin',
    'moderator',
    'standard'
);

-- ============================================================
-- Organization-level role
-- ============================================================
CREATE TYPE org_role AS ENUM (
    'owner',
    'admin',
    'contributor'
);

-- ============================================================
-- Org member / invitation state
-- ============================================================
CREATE TYPE member_status AS ENUM (
    'invited',
    'active',
    'suspended',
    'removed'
);

-- ============================================================
-- Organization tier
-- ============================================================
CREATE TYPE org_tier AS ENUM (
    'free',
    'enhanced'
);

-- ============================================================
-- Content moderation status
-- ============================================================
CREATE TYPE moderation_status AS ENUM (
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'archived'
);

-- ============================================================
-- Event recurrence type
-- ============================================================
CREATE TYPE recurrence_type AS ENUM (
    'none',
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'custom'
);

-- ============================================================
-- Event occurrence status
-- ============================================================
CREATE TYPE occurrence_status AS ENUM (
    'scheduled',
    'cancelled',
    'completed'
);

-- ============================================================
-- Opportunity lifecycle status
-- ============================================================
CREATE TYPE opportunity_status AS ENUM (
    'draft',
    'open',
    'filled',
    'closed',
    'archived'
);

-- ============================================================
-- Opportunity response status
-- ============================================================
CREATE TYPE response_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'withdrawn',
    'completed'
);

-- ============================================================
-- Conversation type
-- ============================================================
CREATE TYPE conversation_type AS ENUM (
    'direct',      -- 1:1 between two users
    'group',       -- small group, org-created
    'context'      -- anchored to an org / event / opportunity
);

-- ============================================================
-- Promotable content type (for promoted_content table)
-- ============================================================
CREATE TYPE promotable_type AS ENUM (
    'organization',
    'event',
    'opportunity',
    'testimony',
    'resource'
);

-- ============================================================
-- Support resource category
-- ============================================================
CREATE TYPE resource_category AS ENUM (
    'mental_health',
    'crisis',
    'housing',
    'food',
    'medical',
    'legal',
    'financial',
    'substance',
    'spiritual',
    'community',
    'other'
);

-- ============================================================
-- Notification delivery channel
-- ============================================================
CREATE TYPE notification_channel AS ENUM (
    'push',
    'email',
    'sms',
    'in_app'
);
