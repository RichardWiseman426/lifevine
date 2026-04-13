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
CREATE VIEW public.moderation_queue
WITH (security_invoker = true)
AS
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
