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
