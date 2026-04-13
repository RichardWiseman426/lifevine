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
