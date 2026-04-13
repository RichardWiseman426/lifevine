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
