-- ============================================================
-- Migration 008: Contributor Applications
-- ============================================================

CREATE TABLE public.contributor_applications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Organization details
    org_name        text NOT NULL
                        CHECK (char_length(org_name) BETWEEN 2 AND 200),
    org_type        text NOT NULL,
    denomination    text,           -- populated only when org_type = 'church'

    -- Location
    city            text,
    state           text,
    website_url     text,

    -- Description
    description     text NOT NULL
                        CHECK (char_length(description) BETWEEN 10 AND 2000),
    usage_intent    text
                        CHECK (usage_intent IS NULL OR char_length(usage_intent) <= 1000),

    -- Contact
    contact_name    text NOT NULL,
    contact_email   text NOT NULL,
    contact_phone   text,

    -- Workflow
    status          text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at     timestamptz,
    reviewer_notes  text,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contrib_apps_status     ON public.contributor_applications(status);
CREATE INDEX idx_contrib_apps_submitted  ON public.contributor_applications(submitted_by);

CREATE TRIGGER trg_contrib_apps_updated_at
    BEFORE UPDATE ON public.contributor_applications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.contributor_applications ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit and view their own applications
CREATE POLICY "Users can insert applications"
    ON public.contributor_applications FOR INSERT
    TO authenticated
    WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can view their own applications"
    ON public.contributor_applications FOR SELECT
    TO authenticated
    USING (submitted_by = auth.uid());

-- Super admins and moderators can see and update all
CREATE POLICY "Admins can manage all applications"
    ON public.contributor_applications FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND platform_role IN ('super_admin', 'moderator')
        )
    );
