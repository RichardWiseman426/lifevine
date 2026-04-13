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
-- ============================================================
-- Migration 002: Core — Users, Profiles, Organizations
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- Extends auth.users with product-level data.
-- Created automatically on signup via the on-signup edge function.
-- ============================================================
CREATE TABLE public.profiles (
    id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username            text UNIQUE NOT NULL
                            CHECK (char_length(username) BETWEEN 3 AND 30
                                   AND username ~ '^[a-zA-Z0-9_]+$'),
    display_name        text NOT NULL
                            CHECK (char_length(display_name) BETWEEN 1 AND 80),
    bio                 text
                            CHECK (char_length(bio) <= 500),
    avatar_url          text,
    phone               text,
    platform_role       platform_role NOT NULL DEFAULT 'standard',
    is_verified         boolean NOT NULL DEFAULT false,
    is_banned           boolean NOT NULL DEFAULT false,
    location_city       text,
    location_state      text,
    location_country    text NOT NULL DEFAULT 'US',
    timezone            text NOT NULL DEFAULT 'America/Chicago',
    onboarding_complete boolean NOT NULL DEFAULT false,
    last_active_at      timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE INDEX idx_profiles_username        ON public.profiles(username);
CREATE INDEX idx_profiles_platform_role   ON public.profiles(platform_role);
CREATE INDEX idx_profiles_deleted_at      ON public.profiles(deleted_at)
    WHERE deleted_at IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. PLATFORM ROLE ASSIGNMENTS
-- Audit trail; the denormalized platform_role on profiles is
-- kept in sync by the trigger below.
-- ============================================================
CREATE TABLE public.platform_role_assignments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role        platform_role NOT NULL,
    granted_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at  timestamptz NOT NULL DEFAULT now(),
    revoked_at  timestamptz,
    revoked_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason      text,
    UNIQUE (user_id, role)
);

CREATE INDEX idx_platform_roles_user ON public.platform_role_assignments(user_id);

-- Sync profiles.platform_role when an assignment is inserted/updated
CREATE OR REPLACE FUNCTION public.sync_platform_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Derive highest role from active assignments
    UPDATE public.profiles
    SET platform_role = (
        SELECT COALESCE(
            MAX(role::text)::platform_role,
            'standard'
        )
        FROM public.platform_role_assignments
        WHERE user_id = NEW.user_id
          AND revoked_at IS NULL
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_platform_role
    AFTER INSERT OR UPDATE ON public.platform_role_assignments
    FOR EACH ROW EXECUTE FUNCTION public.sync_platform_role();

-- ============================================================
-- 3. ORG TIERS
-- Seeded once; tier limits enforced in Edge Functions (not DB).
-- ============================================================
CREATE TABLE public.org_tiers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                org_tier NOT NULL UNIQUE,
    display_name        text NOT NULL,
    max_members         integer,   -- NULL = unlimited
    max_events          integer,
    max_opportunities   integer,
    can_feature_content boolean NOT NULL DEFAULT false,
    can_promote         boolean NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_org_tiers_updated_at
    BEFORE UPDATE ON public.org_tiers
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed tiers
INSERT INTO public.org_tiers (name, display_name, max_members, max_events, max_opportunities, can_feature_content, can_promote)
VALUES
    ('free',     'Free',     50,   10,  5,    false, false),
    ('enhanced', 'Enhanced', NULL, NULL, NULL, true,  true);

-- ============================================================
-- 4. ORGANIZATIONS
-- ============================================================
CREATE TABLE public.organizations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                text UNIQUE NOT NULL
                            CHECK (slug ~ '^[a-z0-9\-]+$'
                                   AND char_length(slug) BETWEEN 2 AND 60),
    name                text NOT NULL
                            CHECK (char_length(name) BETWEEN 2 AND 120),
    description         text
                            CHECK (char_length(description) <= 2000),
    short_description   text
                            CHECK (char_length(short_description) <= 280),
    logo_url            text,
    banner_url          text,
    website_url         text,
    phone               text,
    email               text,
    tier                org_tier NOT NULL DEFAULT 'free',
    is_verified         boolean NOT NULL DEFAULT false,
    is_active           boolean NOT NULL DEFAULT true,
    is_featured         boolean NOT NULL DEFAULT false,
    -- Address
    address_line1       text,
    address_line2       text,
    city                text,
    state               text,
    postal_code         text,
    country             text NOT NULL DEFAULT 'US',
    latitude            numeric(9,6),
    longitude           numeric(9,6),
    -- Categorization
    -- e.g. 'church', 'ministry', 'support_group', 'therapy', 'medical', 'nonprofit', 'community'
    category            text NOT NULL,
    tags                text[] NOT NULL DEFAULT '{}',
    -- Meta
    created_by          uuid NOT NULL REFERENCES public.profiles(id),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE INDEX idx_orgs_slug        ON public.organizations(slug);
CREATE INDEX idx_orgs_tier        ON public.organizations(tier);
CREATE INDEX idx_orgs_category    ON public.organizations(category);
CREATE INDEX idx_orgs_location    ON public.organizations(city, state, country);
CREATE INDEX idx_orgs_tags        ON public.organizations USING gin(tags);
CREATE INDEX idx_orgs_is_featured ON public.organizations(is_featured) WHERE is_featured = true;
CREATE INDEX idx_orgs_deleted_at  ON public.organizations(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_orgs_name_trgm   ON public.organizations USING gin(name gin_trgm_ops);

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. ORG MEMBERS
-- ============================================================
CREATE TABLE public.org_members (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role            org_role NOT NULL DEFAULT 'contributor',
    status          member_status NOT NULL DEFAULT 'active',
    invited_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    invited_at      timestamptz,
    joined_at       timestamptz NOT NULL DEFAULT now(),
    suspended_at    timestamptz,
    removed_at      timestamptz,
    notes           text,   -- internal admin notes only
    UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_members_org    ON public.org_members(org_id);
CREATE INDEX idx_org_members_user   ON public.org_members(user_id);
CREATE INDEX idx_org_members_role   ON public.org_members(org_id, role);
CREATE INDEX idx_org_members_active ON public.org_members(status) WHERE status = 'active';

-- ============================================================
-- 6. ORG INVITATIONS
-- Token-based email invitations; redeemed by on-signup or
-- existing users clicking the invite link.
-- ============================================================
CREATE TABLE public.org_invitations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email       text NOT NULL,
    role        org_role NOT NULL DEFAULT 'contributor',
    token       text UNIQUE NOT NULL,  -- cryptographically random, URL-safe
    invited_by  uuid NOT NULL REFERENCES public.profiles(id),
    expires_at  timestamptz NOT NULL,
    accepted_at timestamptz,
    declined_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invitations_token  ON public.org_invitations(token);
CREATE INDEX idx_org_invitations_email  ON public.org_invitations(email);
CREATE INDEX idx_org_invitations_org    ON public.org_invitations(org_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_tiers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invitations         ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user a super_admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND platform_role = 'super_admin'
          AND deleted_at IS NULL
    );
$$;

-- Helper: is the calling user an active member of an org with a minimum role?
CREATE OR REPLACE FUNCTION public.is_org_member(org uuid, min_role org_role DEFAULT 'contributor')
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_id = org
          AND user_id = auth.uid()
          AND status = 'active'
          AND (
              CASE min_role
                WHEN 'owner'       THEN role = 'owner'
                WHEN 'admin'       THEN role IN ('owner', 'admin')
                WHEN 'contributor' THEN role IN ('owner', 'admin', 'contributor')
              END
          )
    );
$$;

-- profiles
CREATE POLICY "Users can read any non-deleted profile"
    ON public.profiles FOR SELECT
    USING (deleted_at IS NULL);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Super admins can do anything on profiles"
    ON public.profiles FOR ALL
    USING (public.is_super_admin());

-- org_tiers (public read, admin write)
CREATE POLICY "Anyone can read org tiers"
    ON public.org_tiers FOR SELECT USING (true);

CREATE POLICY "Super admins can manage org tiers"
    ON public.org_tiers FOR ALL USING (public.is_super_admin());

-- organizations
CREATE POLICY "Anyone can read active non-deleted orgs"
    ON public.organizations FOR SELECT
    USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Org admins can update their org"
    ON public.organizations FOR UPDATE
    USING (public.is_org_member(id, 'admin'));

CREATE POLICY "Authenticated users can create orgs"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Super admins can do anything on orgs"
    ON public.organizations FOR ALL
    USING (public.is_super_admin());

-- org_members
CREATE POLICY "Org members can see their org's member list"
    ON public.org_members FOR SELECT
    USING (public.is_org_member(org_id));

CREATE POLICY "Org admins can manage members"
    ON public.org_members FOR ALL
    USING (public.is_org_member(org_id, 'admin'));

CREATE POLICY "Super admins can do anything on org_members"
    ON public.org_members FOR ALL
    USING (public.is_super_admin());

-- org_invitations
CREATE POLICY "Org admins can read and create invitations"
    ON public.org_invitations FOR SELECT
    USING (public.is_org_member(org_id, 'admin'));

CREATE POLICY "Org admins can insert invitations"
    ON public.org_invitations FOR INSERT
    WITH CHECK (public.is_org_member(org_id, 'admin'));

CREATE POLICY "Super admins can do anything on invitations"
    ON public.org_invitations FOR ALL
    USING (public.is_super_admin());
-- ============================================================
-- Migration 003: Events, Schedules, Occurrences, RSVPs,
--                Opportunities, Steps, Responses
-- ============================================================

-- ============================================================
-- 1. EVENTS
-- ============================================================
CREATE TABLE public.events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by          uuid NOT NULL REFERENCES public.profiles(id),
    title               text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    description         text CHECK (char_length(description) <= 5000),
    short_description   text CHECK (char_length(short_description) <= 280),
    cover_image_url     text,
    -- e.g. 'service', 'community', 'support', 'workshop', 'conference', 'outreach'
    category            text NOT NULL,
    tags                text[] NOT NULL DEFAULT '{}',
    -- Location
    is_virtual          boolean NOT NULL DEFAULT false,
    virtual_url         text,
    address_line1       text,
    address_line2       text,
    city                text,
    state               text,
    postal_code         text,
    country             text DEFAULT 'US',
    latitude            numeric(9,6),
    longitude           numeric(9,6),
    -- Capacity
    max_attendees       integer,  -- NULL = unlimited
    -- Visibility & moderation
    is_public           boolean NOT NULL DEFAULT true,
    -- Events created by vetted org members default to 'approved'
    status              moderation_status NOT NULL DEFAULT 'approved',
    is_featured         boolean NOT NULL DEFAULT false,
    -- Meta
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE INDEX idx_events_org        ON public.events(org_id);
CREATE INDEX idx_events_category   ON public.events(category);
CREATE INDEX idx_events_tags       ON public.events USING gin(tags);
CREATE INDEX idx_events_is_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX idx_events_deleted_at ON public.events(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_events_title_trgm ON public.events USING gin(title gin_trgm_ops);

CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. EVENT SCHEDULES
-- Stores recurrence rules. One event can have multiple schedules
-- (e.g. weekly Sunday service + monthly special service).
-- ============================================================
CREATE TABLE public.event_schedules (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    recurrence          recurrence_type NOT NULL DEFAULT 'none',
    -- RFC 5545 RRULE string for 'custom' recurrence; null otherwise
    rrule               text,
    starts_at           timestamptz NOT NULL,
    ends_at             timestamptz NOT NULL,
    -- Stored for query performance; computed from starts_at/ends_at
    duration_minutes    integer NOT NULL GENERATED ALWAYS AS (
                            EXTRACT(EPOCH FROM (ends_at - starts_at))::integer / 60
                        ) STORED,
    recurrence_end_date date,    -- NULL = no end date
    max_occurrences     integer, -- NULL = no limit
    timezone            text NOT NULL DEFAULT 'America/Chicago',
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_schedule_end CHECK (ends_at > starts_at)
);

CREATE INDEX idx_event_schedules_event  ON public.event_schedules(event_id);
CREATE INDEX idx_event_schedules_starts ON public.event_schedules(starts_at);

CREATE TRIGGER trg_event_schedules_updated_at
    BEFORE UPDATE ON public.event_schedules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 3. EVENT OCCURRENCES
-- Materialized concrete instances generated nightly by the
-- expand-recurrences Edge Function. RSVPs attach here.
-- ============================================================
CREATE TABLE public.event_occurrences (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    schedule_id         uuid NOT NULL REFERENCES public.event_schedules(id) ON DELETE CASCADE,
    starts_at           timestamptz NOT NULL,
    ends_at             timestamptz NOT NULL,
    status              occurrence_status NOT NULL DEFAULT 'scheduled',
    cancellation_reason text,
    -- Per-occurrence overrides (e.g. holiday special)
    override_title      text,
    override_location   text,
    -- Denormalized counter updated by trigger
    rsvp_count          integer NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (schedule_id, starts_at)
);

CREATE INDEX idx_occurrences_event    ON public.event_occurrences(event_id);
CREATE INDEX idx_occurrences_starts   ON public.event_occurrences(starts_at);
CREATE INDEX idx_occurrences_status   ON public.event_occurrences(status);
-- Fast "find upcoming events" query
CREATE INDEX idx_occurrences_upcoming ON public.event_occurrences(starts_at, status)
    WHERE status = 'scheduled';

CREATE TRIGGER trg_event_occurrences_updated_at
    BEFORE UPDATE ON public.event_occurrences
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. EVENT RSVPS
-- ============================================================
CREATE TABLE public.event_rsvps (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurrence_id   uuid NOT NULL REFERENCES public.event_occurrences(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    guest_count     integer NOT NULL DEFAULT 1 CHECK (guest_count >= 1),
    notes           text CHECK (char_length(notes) <= 500),
    checked_in_at   timestamptz,
    cancelled_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (occurrence_id, user_id)
);

CREATE INDEX idx_rsvps_occurrence ON public.event_rsvps(occurrence_id);
CREATE INDEX idx_rsvps_user       ON public.event_rsvps(user_id);

CREATE TRIGGER trg_event_rsvps_updated_at
    BEFORE UPDATE ON public.event_rsvps
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintain rsvp_count on event_occurrences
CREATE OR REPLACE FUNCTION public.update_rsvp_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.cancelled_at IS NULL THEN
        UPDATE public.event_occurrences
        SET rsvp_count = rsvp_count + NEW.guest_count
        WHERE id = NEW.occurrence_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalculate to keep consistent
        UPDATE public.event_occurrences
        SET rsvp_count = (
            SELECT COALESCE(SUM(guest_count), 0)
            FROM public.event_rsvps
            WHERE occurrence_id = NEW.occurrence_id
              AND cancelled_at IS NULL
        )
        WHERE id = NEW.occurrence_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.event_occurrences
        SET rsvp_count = GREATEST(0, rsvp_count - OLD.guest_count)
        WHERE id = OLD.occurrence_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_rsvp_count
    AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvps
    FOR EACH ROW EXECUTE FUNCTION public.update_rsvp_count();

-- ============================================================
-- 5. OPPORTUNITIES  (first-class feature)
-- ============================================================
CREATE TABLE public.opportunities (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by              uuid NOT NULL REFERENCES public.profiles(id),
    title                   text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    description             text CHECK (char_length(description) <= 5000),
    short_description       text CHECK (char_length(short_description) <= 280),
    cover_image_url         text,
    -- e.g. 'volunteer', 'service', 'community_need', 'prayer', 'donation', 'mentorship'
    category                text NOT NULL,
    tags                    text[] NOT NULL DEFAULT '{}',
    -- Time commitment
    is_recurring            boolean NOT NULL DEFAULT false,
    commitment_hours        numeric(5,1),
    commitment_description  text,  -- human-readable: "2 hours every Saturday morning"
    starts_at               timestamptz,
    ends_at                 timestamptz,
    -- Capacity
    spots_total             integer,   -- NULL = unlimited
    spots_filled            integer NOT NULL DEFAULT 0,
    -- Location
    is_remote               boolean NOT NULL DEFAULT false,
    address_line1           text,
    city                    text,
    state                   text,
    postal_code             text,
    country                 text DEFAULT 'US',
    latitude                numeric(9,6),
    longitude               numeric(9,6),
    -- Actionability: clear next-step contact info (critical feature requirement)
    contact_name            text,
    contact_email           text,
    contact_phone           text,
    -- Status & visibility
    status                  opportunity_status NOT NULL DEFAULT 'open',
    is_featured             boolean NOT NULL DEFAULT false,
    -- Meta
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    deleted_at              timestamptz,
    CONSTRAINT chk_opp_spots CHECK (
        spots_filled <= COALESCE(spots_total, spots_filled + 1)
    )
);

CREATE INDEX idx_opportunities_org      ON public.opportunities(org_id);
CREATE INDEX idx_opportunities_status   ON public.opportunities(status);
CREATE INDEX idx_opportunities_category ON public.opportunities(category);
CREATE INDEX idx_opportunities_tags     ON public.opportunities USING gin(tags);
CREATE INDEX idx_opportunities_location ON public.opportunities(city, state, country);
CREATE INDEX idx_opportunities_featured ON public.opportunities(is_featured) WHERE is_featured = true;
CREATE INDEX idx_opportunities_deleted  ON public.opportunities(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_opp_title_trgm         ON public.opportunities USING gin(title gin_trgm_ops);

CREATE TRIGGER trg_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. OPPORTUNITY STEPS
-- Ordered actionable next steps displayed on the opportunity.
-- action_type drives the CTA button behavior in the client.
-- ============================================================
CREATE TABLE public.opportunity_steps (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    step_order      smallint NOT NULL CHECK (step_order >= 1),
    title           text NOT NULL CHECK (char_length(title) <= 200),
    description     text CHECK (char_length(description) <= 1000),
    -- 'form' | 'phone' | 'email' | 'show_up' | 'read' | 'link'
    action_type     text NOT NULL,
    action_url      text,
    action_label    text,  -- button label: "Call Now", "Fill Out Form", "Show Up Saturday"
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (opportunity_id, step_order)
);

CREATE INDEX idx_opp_steps_opp ON public.opportunity_steps(opportunity_id);

-- ============================================================
-- 7. OPPORTUNITY RESPONSES
-- ============================================================
CREATE TABLE public.opportunity_responses (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id      uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status              response_status NOT NULL DEFAULT 'pending',
    message             text CHECK (char_length(message) <= 1000),
    availability_notes  text CHECK (char_length(availability_notes) <= 500),
    responded_at        timestamptz NOT NULL DEFAULT now(),
    reviewed_at         timestamptz,
    reviewed_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_notes      text,  -- internal only, never shown to responder
    completed_at        timestamptz,
    withdrawn_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (opportunity_id, user_id)
);

CREATE INDEX idx_opp_responses_opp    ON public.opportunity_responses(opportunity_id);
CREATE INDEX idx_opp_responses_user   ON public.opportunity_responses(user_id);
CREATE INDEX idx_opp_responses_status ON public.opportunity_responses(status);

CREATE TRIGGER trg_opp_responses_updated_at
    BEFORE UPDATE ON public.opportunity_responses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintain spots_filled on opportunities
CREATE OR REPLACE FUNCTION public.update_spots_filled()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.opportunities
    SET spots_filled = (
        SELECT COUNT(*)
        FROM public.opportunity_responses
        WHERE opportunity_id = COALESCE(NEW.opportunity_id, OLD.opportunity_id)
          AND status IN ('accepted', 'completed')
    )
    WHERE id = COALESCE(NEW.opportunity_id, OLD.opportunity_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_spots_filled
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_spots_filled();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_occurrences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_responses ENABLE ROW LEVEL SECURITY;

-- Events: public read for approved/public events
CREATE POLICY "Anyone can read public approved events"
    ON public.events FOR SELECT
    USING (is_public = true AND status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Org contributors can manage their org events"
    ON public.events FOR ALL
    USING (public.is_org_member(org_id, 'contributor'));

CREATE POLICY "Super admins can do anything on events"
    ON public.events FOR ALL USING (public.is_super_admin());

-- Event schedules / occurrences follow event visibility
CREATE POLICY "Read event schedules for accessible events"
    ON public.event_schedules FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND (e.is_public = true AND e.status = 'approved' AND e.deleted_at IS NULL
               OR public.is_org_member(e.org_id))
    ));

CREATE POLICY "Org contributors can manage event schedules"
    ON public.event_schedules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id AND public.is_org_member(e.org_id, 'contributor')
    ));

CREATE POLICY "Read event occurrences for accessible events"
    ON public.event_occurrences FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id
          AND (e.is_public = true AND e.status = 'approved' AND e.deleted_at IS NULL
               OR public.is_org_member(e.org_id))
    ));

-- RSVPs: users manage their own
CREATE POLICY "Users can read their own RSVPs"
    ON public.event_rsvps FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create RSVPs"
    ON public.event_rsvps FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own RSVPs"
    ON public.event_rsvps FOR UPDATE USING (user_id = auth.uid());

-- Opportunities: public read for open ones
CREATE POLICY "Anyone can read open opportunities"
    ON public.opportunities FOR SELECT
    USING (status = 'open' AND deleted_at IS NULL);

CREATE POLICY "Org contributors can manage their opportunities"
    ON public.opportunities FOR ALL
    USING (public.is_org_member(org_id, 'contributor'));

CREATE POLICY "Super admins can do anything on opportunities"
    ON public.opportunities FOR ALL USING (public.is_super_admin());

CREATE POLICY "Anyone can read steps for open opportunities"
    ON public.opportunity_steps FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.opportunities o
        WHERE o.id = opportunity_id AND o.status = 'open' AND o.deleted_at IS NULL
    ));

-- Responses: user sees their own; org admin sees all for their org
CREATE POLICY "Users can manage their own responses"
    ON public.opportunity_responses FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Org admins can read and update responses for their opportunities"
    ON public.opportunity_responses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.opportunities o
        WHERE o.id = opportunity_id AND public.is_org_member(o.org_id, 'admin')
    ));

CREATE POLICY "Super admins can do anything on responses"
    ON public.opportunity_responses FOR ALL USING (public.is_super_admin());
-- ============================================================
-- Migration 004: Testimonies, Resources, Messaging
-- ============================================================

-- ============================================================
-- 1. TESTIMONIES
-- User-generated, structured, fully moderated.
-- ============================================================
CREATE TABLE public.testimonies (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Optional context — ties testimony to an org, event, or opportunity
    org_id          uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_id        uuid REFERENCES public.events(id) ON DELETE SET NULL,
    opportunity_id  uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
    -- Content
    title           text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    body            text NOT NULL CHECK (char_length(body) BETWEEN 50 AND 10000),
    -- e.g. 'healing', 'provision', 'community', 'restoration', 'salvation', 'other'
    category        text NOT NULL,
    is_anonymous    boolean NOT NULL DEFAULT false,
    media_urls      text[] NOT NULL DEFAULT '{}',
    -- Moderation: user-generated content defaults to pending_review
    status          moderation_status NOT NULL DEFAULT 'pending_review',
    moderated_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at    timestamptz,
    rejection_reason text,
    -- Denormalized counter
    response_count  integer NOT NULL DEFAULT 0,
    is_featured     boolean NOT NULL DEFAULT false,
    -- Meta
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE INDEX idx_testimonies_author   ON public.testimonies(author_id);
CREATE INDEX idx_testimonies_org      ON public.testimonies(org_id);
CREATE INDEX idx_testimonies_status   ON public.testimonies(status);
CREATE INDEX idx_testimonies_category ON public.testimonies(category);
CREATE INDEX idx_testimonies_featured ON public.testimonies(is_featured) WHERE is_featured = true;
CREATE INDEX idx_testimonies_deleted  ON public.testimonies(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TRIGGER trg_testimonies_updated_at
    BEFORE UPDATE ON public.testimonies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. TESTIMONY RESPONSES
-- Context-bound encouragement / discussion. Also moderated.
-- ============================================================
CREATE TABLE public.testimony_responses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    testimony_id    uuid NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
    author_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body            text NOT NULL CHECK (char_length(body) BETWEEN 5 AND 2000),
    -- Moderation
    status          moderation_status NOT NULL DEFAULT 'pending_review',
    moderated_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at    timestamptz,
    rejection_reason text,
    -- Meta
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE INDEX idx_testimony_responses_testimony ON public.testimony_responses(testimony_id);
CREATE INDEX idx_testimony_responses_author    ON public.testimony_responses(author_id);
CREATE INDEX idx_testimony_responses_status    ON public.testimony_responses(status);
CREATE INDEX idx_testimony_responses_deleted   ON public.testimony_responses(deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE TRIGGER trg_testimony_responses_updated_at
    BEFORE UPDATE ON public.testimony_responses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintain response_count on testimonies
CREATE OR REPLACE FUNCTION public.update_testimony_response_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    t_id uuid;
BEGIN
    t_id := COALESCE(NEW.testimony_id, OLD.testimony_id);
    UPDATE public.testimonies
    SET response_count = (
        SELECT COUNT(*)
        FROM public.testimony_responses
        WHERE testimony_id = t_id
          AND status = 'approved'
          AND deleted_at IS NULL
    )
    WHERE id = t_id;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_testimony_response_count
    AFTER INSERT OR UPDATE OR DELETE ON public.testimony_responses
    FOR EACH ROW EXECUTE FUNCTION public.update_testimony_response_count();

-- ============================================================
-- 3. RESOURCES
-- Support, therapy, medical, community resources.
-- Crisis resources (is_crisis=true) always surface first.
-- ============================================================
CREATE TABLE public.resources (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    added_by        uuid NOT NULL REFERENCES public.profiles(id),
    title           text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
    description     text CHECK (char_length(description) <= 2000),
    category        resource_category NOT NULL,
    tags            text[] NOT NULL DEFAULT '{}',
    -- Contact / access
    phone           text,
    email           text,
    website_url     text,
    -- Downloadable file
    file_url        text,
    file_type       text,
    file_size_bytes bigint,
    -- Location
    is_national     boolean NOT NULL DEFAULT false,
    city            text,
    state           text,
    country         text DEFAULT 'US',
    -- Status & visibility
    status          moderation_status NOT NULL DEFAULT 'pending_review',
    is_featured     boolean NOT NULL DEFAULT false,
    is_crisis       boolean NOT NULL DEFAULT false,
    moderated_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    moderated_at    timestamptz,
    -- Meta
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz
);

CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_org      ON public.resources(org_id);
CREATE INDEX idx_resources_tags     ON public.resources USING gin(tags);
CREATE INDEX idx_resources_crisis   ON public.resources(is_crisis) WHERE is_crisis = true;
CREATE INDEX idx_resources_status   ON public.resources(status);
CREATE INDEX idx_resources_location ON public.resources(city, state, country);
CREATE INDEX idx_resources_deleted  ON public.resources(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE TRIGGER trg_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. CONVERSATIONS
-- Three types:
--   direct  — 1:1 between two users
--   group   — small org-created group (no open forum)
--   context — anchored to an org, event, or opportunity
-- At most ONE context FK may be set (enforced by CHECK).
-- ============================================================
CREATE TABLE public.conversations (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type            conversation_type NOT NULL DEFAULT 'direct',
    title           text,  -- for group conversations
    -- Context anchors (at most one)
    org_id          uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_id        uuid REFERENCES public.events(id) ON DELETE SET NULL,
    opportunity_id  uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
    created_by      uuid NOT NULL REFERENCES public.profiles(id),
    last_message_at timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT chk_context_single CHECK (
        (CASE WHEN org_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN event_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN opportunity_id IS NOT NULL THEN 1 ELSE 0 END) <= 1
    )
);

CREATE INDEX idx_conversations_type         ON public.conversations(type);
CREATE INDEX idx_conversations_org          ON public.conversations(org_id);
CREATE INDEX idx_conversations_event        ON public.conversations(event_id);
CREATE INDEX idx_conversations_opportunity  ON public.conversations(opportunity_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC)
    WHERE deleted_at IS NULL;

CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. CONVERSATION PARTICIPANTS
-- ============================================================
CREATE TABLE public.conversation_participants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at       timestamptz NOT NULL DEFAULT now(),
    left_at         timestamptz,
    last_read_at    timestamptz,
    is_admin        boolean NOT NULL DEFAULT false,  -- can manage group conversation
    muted_until     timestamptz,
    UNIQUE (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conv   ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user   ON public.conversation_participants(user_id);
CREATE INDEX idx_conv_participants_active ON public.conversation_participants(user_id)
    WHERE left_at IS NULL;

-- ============================================================
-- 6. MESSAGES
-- ============================================================
CREATE TABLE public.messages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id       uuid NOT NULL REFERENCES public.profiles(id),
    body            text CHECK (char_length(body) <= 4000),
    -- Attachment
    attachment_url  text,
    attachment_type text,  -- 'image' | 'document' | 'link'
    -- Link preview / file metadata (variable shape)
    attachment_meta jsonb,
    -- One-level threading only (no recursive nesting)
    reply_to_id     uuid REFERENCES public.messages(id) ON DELETE SET NULL,
    -- Soft delete (high-frequency — bool instead of timestamptz)
    is_deleted      boolean NOT NULL DEFAULT false,
    deleted_at      timestamptz,
    deleted_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    sent_at         timestamptz NOT NULL DEFAULT now(),
    edited_at       timestamptz,
    CONSTRAINT chk_message_has_content CHECK (
        body IS NOT NULL OR attachment_url IS NOT NULL
    )
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, sent_at DESC);
CREATE INDEX idx_messages_sender       ON public.messages(sender_id);
CREATE INDEX idx_messages_reply        ON public.messages(reply_to_id);
CREATE INDEX idx_messages_active       ON public.messages(conversation_id, sent_at DESC)
    WHERE is_deleted = false;

-- Update conversations.last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.sent_at,
        updated_at      = NEW.sent_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_last_message_at
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.testimonies             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimony_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                ENABLE ROW LEVEL SECURITY;

-- Testimonies: approved ones are public; authors see their own; moderators see all
CREATE POLICY "Anyone can read approved testimonies"
    ON public.testimonies FOR SELECT
    USING (status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Authors can read and manage their own testimonies"
    ON public.testimonies FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Moderators and super admins can do anything on testimonies"
    ON public.testimonies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND platform_role IN ('moderator', 'super_admin')
        )
    );

-- Testimony responses: same pattern
CREATE POLICY "Anyone can read approved testimony responses"
    ON public.testimony_responses FOR SELECT
    USING (status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Authors can manage their own responses"
    ON public.testimony_responses FOR ALL USING (author_id = auth.uid());

CREATE POLICY "Moderators can do anything on testimony responses"
    ON public.testimony_responses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND platform_role IN ('moderator', 'super_admin')
        )
    );

-- Resources: approved ones are public
CREATE POLICY "Anyone can read approved resources"
    ON public.resources FOR SELECT
    USING (status = 'approved' AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can submit resources"
    ON public.resources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND added_by = auth.uid());

CREATE POLICY "Moderators can manage resources"
    ON public.resources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND platform_role IN ('moderator', 'super_admin')
        )
    );

-- Conversations: participants only
CREATE POLICY "Participants can read their conversations"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = id
              AND user_id = auth.uid()
              AND left_at IS NULL
        )
    );

CREATE POLICY "Authenticated users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Participants: only visible to conversation members
CREATE POLICY "Participants can see each other"
    ON public.conversation_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = conversation_id
              AND cp2.user_id = auth.uid()
              AND cp2.left_at IS NULL
        )
    );

-- Messages: participants can read and send
CREATE POLICY "Participants can read messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id
              AND user_id = auth.uid()
              AND left_at IS NULL
        )
    );

CREATE POLICY "Participants can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id
              AND user_id = auth.uid()
              AND left_at IS NULL
        )
    );

CREATE POLICY "Senders can soft-delete their own messages"
    ON public.messages FOR UPDATE
    USING (sender_id = auth.uid());

CREATE POLICY "Super admins can do anything on messages"
    ON public.messages FOR ALL USING (public.is_super_admin());
-- ============================================================
-- Migration 005: Promotion, Notifications, Audit Log,
--                Moderation Queue View
-- ============================================================

-- ============================================================
-- 1. PROMOTED CONTENT
-- Admin-controlled only. No self-service, no bidding.
-- Exactly one entity FK must be set (enforced by CHECK).
-- ============================================================
CREATE TABLE public.promoted_content (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promotable_type     promotable_type NOT NULL,
    -- Entity references — exactly one must be non-null
    org_id              uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_id            uuid REFERENCES public.events(id) ON DELETE CASCADE,
    opportunity_id      uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
    testimony_id        uuid REFERENCES public.testimonies(id) ON DELETE CASCADE,
    resource_id         uuid REFERENCES public.resources(id) ON DELETE CASCADE,
    -- Display slot: 'home_banner' | 'explore_top' | 'category_spotlight' | 'opportunity_featured'
    slot_label          text NOT NULL,
    -- Higher priority = more prominent within the same slot
    priority            smallint NOT NULL DEFAULT 50,
    starts_at           timestamptz NOT NULL,
    ends_at             timestamptz,   -- NULL = indefinite
    is_active           boolean NOT NULL DEFAULT true,
    -- Admin attribution
    created_by          uuid NOT NULL REFERENCES public.profiles(id),
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_promoted_single_ref CHECK (
        (CASE WHEN org_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN event_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN opportunity_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN testimony_id IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN resource_id IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

CREATE INDEX idx_promoted_active ON public.promoted_content(slot_label, priority DESC)
    WHERE is_active = true;
CREATE INDEX idx_promoted_type   ON public.promoted_content(promotable_type);
CREATE INDEX idx_promoted_dates  ON public.promoted_content(starts_at, ends_at);

CREATE TRIGGER trg_promoted_updated_at
    BEFORE UPDATE ON public.promoted_content
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-deactivate expired promotions
CREATE OR REPLACE FUNCTION public.expire_promotions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.promoted_content
    SET is_active = false
    WHERE is_active = true
      AND ends_at IS NOT NULL
      AND ends_at < now();
END;
$$;

-- ============================================================
-- 2. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- e.g. 'opportunity.accepted', 'event.reminder', 'testimony.approved', 'message.new'
    type            text NOT NULL,
    title           text NOT NULL,
    body            text NOT NULL,
    -- Deep link context
    entity_type     text,   -- 'opportunity' | 'event' | 'testimony' | 'message' | etc.
    entity_id       uuid,
    -- Delivery
    channel         notification_channel NOT NULL,
    is_read         boolean NOT NULL DEFAULT false,
    read_at         timestamptz,
    sent_at         timestamptz,
    failed_at       timestamptz,
    failure_reason  text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user   ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id)
    WHERE is_read = false;

-- ============================================================
-- 3. NOTIFICATION PREFERENCES
-- Per-user, per-type channel preferences.
-- ============================================================
CREATE TABLE public.notification_preferences (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type   text NOT NULL,
    push_enabled        boolean NOT NULL DEFAULT true,
    email_enabled       boolean NOT NULL DEFAULT false,
    sms_enabled         boolean NOT NULL DEFAULT false,
    in_app_enabled      boolean NOT NULL DEFAULT true,
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, notification_type)
);

CREATE INDEX idx_notif_prefs_user ON public.notification_preferences(user_id);

CREATE TRIGGER trg_notif_prefs_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. AUDIT LOG
-- Lightweight append-only record of sensitive admin actions.
-- Uses bigint identity PK (not uuid) for efficient ordering.
-- ============================================================
CREATE TABLE public.audit_log (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Dot-namespaced action: 'org.member.suspend', 'testimony.reject', etc.
    action      text NOT NULL,
    entity_type text NOT NULL,
    entity_id   uuid NOT NULL,
    -- JSON snapshot: before/after state, reason, metadata
    payload     jsonb,
    ip_address  inet,
    user_agent  text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor   ON public.audit_log(actor_id);
CREATE INDEX idx_audit_entity  ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- ============================================================
-- 5. MODERATION QUEUE VIEW
-- Surfaces all pending-review content for moderators in a
-- single place, ordered oldest-first (FIFO moderation).
-- ============================================================
CREATE VIEW public.moderation_queue AS
    SELECT
        'testimony'         AS content_type,
        t.id                AS content_id,
        t.author_id         AS submitted_by,
        t.created_at        AS submitted_at,
        t.status,
        t.title             AS preview
    FROM public.testimonies t
    WHERE t.status = 'pending_review' AND t.deleted_at IS NULL
    UNION ALL
    SELECT
        'testimony_response',
        tr.id,
        tr.author_id,
        tr.created_at,
        tr.status,
        LEFT(tr.body, 100)
    FROM public.testimony_responses tr
    WHERE tr.status = 'pending_review' AND tr.deleted_at IS NULL
    UNION ALL
    SELECT
        'resource',
        r.id,
        r.added_by,
        r.created_at,
        r.status,
        r.title
    FROM public.resources r
    WHERE r.status = 'pending_review' AND r.deleted_at IS NULL
    ORDER BY submitted_at ASC;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.promoted_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log                 ENABLE ROW LEVEL SECURITY;

-- Promoted content: anyone can read active, in-window promos
CREATE POLICY "Anyone can read active promoted content"
    ON public.promoted_content FOR SELECT
    USING (
        is_active = true
        AND starts_at <= now()
        AND (ends_at IS NULL OR ends_at > now())
    );

CREATE POLICY "Super admins can manage promoted content"
    ON public.promoted_content FOR ALL USING (public.is_super_admin());

-- Notifications: users see only their own
CREATE POLICY "Users can read and update their own notifications"
    ON public.notifications FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Super admins can read all notifications"
    ON public.notifications FOR SELECT USING (public.is_super_admin());

-- Notification preferences: own only
CREATE POLICY "Users can manage their own notification preferences"
    ON public.notification_preferences FOR ALL USING (user_id = auth.uid());

-- Audit log: super admins only
CREATE POLICY "Super admins can read audit log"
    ON public.audit_log FOR SELECT USING (public.is_super_admin());
