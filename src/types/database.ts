/**
 * TypeScript types for the LifeVine database schema.
 * Compatible with @supabase/supabase-js v2.40+ (requires Relationships field on every table).
 *
 * To regenerate from the live project:
 *   npx supabase login
 *   npx supabase gen types typescript --project-id ikiwhhuxodegpwuuqblz > src/types/database.ts
 */

export type PlatformRole = 'super_admin' | 'moderator' | 'standard';
export type OrgRole = 'owner' | 'admin' | 'contributor';
export type MemberStatus = 'invited' | 'active' | 'suspended' | 'removed';
export type OrgTier = 'free' | 'enhanced';
export type ModerationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type OccurrenceStatus = 'scheduled' | 'cancelled' | 'completed';
export type OpportunityStatus = 'draft' | 'open' | 'filled' | 'closed' | 'archived';
export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'completed';
export type ConversationType = 'direct' | 'group' | 'context';
export type PromotableType = 'organization' | 'event' | 'opportunity' | 'testimony' | 'resource';
export type ResourceCategory =
  | 'mental_health' | 'crisis' | 'housing' | 'food' | 'medical'
  | 'legal' | 'financial' | 'substance' | 'spiritual' | 'community' | 'other';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

// ─── Shared row types (used outside the Database interface too) ───────────────

export type ProfileRow = {
  id: string; username: string; first_name: string | null; last_name: string | null;
  display_name: string; bio: string | null; avatar_url: string | null; phone: string | null;
  platform_role: PlatformRole; is_verified: boolean; is_banned: boolean;
  location_city: string | null; location_state: string | null; location_country: string;
  timezone: string; onboarding_complete: boolean; last_active_at: string | null;
  created_at: string; updated_at: string; deleted_at: string | null;
};

export type OrganizationRow = {
  id: string; slug: string; name: string; description: string | null;
  short_description: string | null; logo_url: string | null; banner_url: string | null;
  website_url: string | null; phone: string | null; email: string | null;
  tier: OrgTier; is_verified: boolean; is_active: boolean; is_featured: boolean;
  address_line1: string | null; address_line2: string | null;
  city: string | null; state: string | null; postal_code: string | null; country: string;
  latitude: number | null; longitude: number | null; category: string;
  denomination: string | null; contact_name: string | null; contact_title: string | null;
  gallery_urls: string[]; mission_statement: string | null; service_times: string | null;
  services_offered: string[]; practice_details: string | null;
  social_facebook: string | null; social_instagram: string | null;
  social_youtube: string | null; social_twitter: string | null;
  pastor_name: string | null; pastor_title: string | null;
  pastor_bio: string | null; pastor_image_url: string | null;
  donation_url: string | null; tags: string[];
  created_by: string; created_at: string; updated_at: string; deleted_at: string | null;
};

// ─── Database interface ───────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };

      platform_role_assignments: {
        Row: {
          id: string; user_id: string; role: PlatformRole;
          granted_by: string | null; granted_at: string;
          revoked_at: string | null; revoked_by: string | null; reason: string | null;
        };
        Insert: { user_id: string; role: PlatformRole; granted_by?: string | null; reason?: string | null };
        Update: { revoked_at?: string | null; revoked_by?: string | null; reason?: string | null };
        Relationships: [];
      };

      organizations: {
        Row: OrganizationRow;
        Insert: Omit<OrganizationRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OrganizationRow, 'id' | 'created_at'>>;
        Relationships: [];
      };

      org_tiers: {
        Row: {
          id: string; name: OrgTier; display_name: string;
          max_members: number | null; max_events: number | null; max_opportunities: number | null;
          can_feature_content: boolean; can_promote: boolean;
          created_at: string; updated_at: string;
        };
        Insert: { name: OrgTier; display_name: string; max_members?: number | null; max_events?: number | null; max_opportunities?: number | null; can_feature_content?: boolean; can_promote?: boolean };
        Update: { display_name?: string; max_members?: number | null; max_events?: number | null; max_opportunities?: number | null; can_feature_content?: boolean; can_promote?: boolean };
        Relationships: [];
      };

      org_members: {
        Row: {
          id: string; org_id: string; user_id: string; role: OrgRole; status: MemberStatus;
          invited_by: string | null; invited_at: string | null; joined_at: string;
          suspended_at: string | null; removed_at: string | null; notes: string | null;
        };
        Insert: { org_id: string; user_id: string; role?: OrgRole; status?: MemberStatus; invited_by?: string | null; notes?: string | null };
        Update: { role?: OrgRole; status?: MemberStatus; suspended_at?: string | null; removed_at?: string | null; notes?: string | null };
        Relationships: [];
      };

      org_invitations: {
        Row: {
          id: string; org_id: string; email: string; role: OrgRole; token: string;
          invited_by: string; expires_at: string;
          accepted_at: string | null; declined_at: string | null; created_at: string;
        };
        Insert: { org_id: string; email: string; role?: OrgRole; token: string; invited_by: string; expires_at: string };
        Update: { accepted_at?: string | null; declined_at?: string | null };
        Relationships: [];
      };

      events: {
        Row: {
          id: string; org_id: string; created_by: string; title: string;
          description: string | null; short_description: string | null; cover_image_url: string | null;
          category: string; tags: string[]; is_virtual: boolean; virtual_url: string | null;
          address_line1: string | null; address_line2: string | null;
          city: string | null; state: string | null; postal_code: string | null; country: string | null;
          latitude: number | null; longitude: number | null;
          max_attendees: number | null; is_public: boolean;
          status: ModerationStatus; is_featured: boolean;
          created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { org_id: string; created_by: string; title: string; category: string; tags?: string[]; is_virtual?: boolean; is_public?: boolean; status?: ModerationStatus; description?: string | null; short_description?: string | null; cover_image_url?: string | null; virtual_url?: string | null; address_line1?: string | null; address_line2?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; country?: string | null; latitude?: number | null; longitude?: number | null; max_attendees?: number | null; is_featured?: boolean; deleted_at?: string | null };
        Update: { title?: string; description?: string | null; short_description?: string | null; cover_image_url?: string | null; category?: string; tags?: string[]; is_virtual?: boolean; virtual_url?: string | null; address_line1?: string | null; city?: string | null; state?: string | null; status?: ModerationStatus; is_featured?: boolean; deleted_at?: string | null };
        Relationships: [];
      };

      event_schedules: {
        Row: {
          id: string; event_id: string; recurrence: RecurrenceType; rrule: string | null;
          starts_at: string; ends_at: string; recurrence_end_date: string | null;
          max_occurrences: number | null; timezone: string;
        };
        Insert: { event_id: string; recurrence?: RecurrenceType; rrule?: string | null; starts_at: string; ends_at: string; recurrence_end_date?: string | null; max_occurrences?: number | null; timezone?: string };
        Update: { recurrence?: RecurrenceType; starts_at?: string; ends_at?: string; recurrence_end_date?: string | null };
        Relationships: [];
      };

      event_occurrences: {
        Row: {
          id: string; event_id: string; schedule_id: string;
          starts_at: string; ends_at: string; status: OccurrenceStatus;
          cancellation_reason: string | null; override_title: string | null; override_location: string | null;
          rsvp_count: number;
        };
        Insert: { event_id: string; schedule_id: string; starts_at: string; ends_at: string; status?: OccurrenceStatus; cancellation_reason?: string | null; override_title?: string | null; override_location?: string | null };
        Update: { status?: OccurrenceStatus; cancellation_reason?: string | null; override_title?: string | null; override_location?: string | null };
        Relationships: [];
      };

      event_rsvps: {
        Row: {
          id: string; occurrence_id: string; user_id: string;
          guest_count: number; notes: string | null; checked_in_at: string | null; cancelled_at: string | null;
        };
        Insert: { occurrence_id: string; user_id: string; guest_count?: number; notes?: string | null };
        Update: { guest_count?: number; checked_in_at?: string | null; cancelled_at?: string | null };
        Relationships: [];
      };

      opportunities: {
        Row: {
          id: string; org_id: string; created_by: string; title: string;
          description: string | null; short_description: string | null; cover_image_url: string | null;
          category: string; tags: string[]; is_recurring: boolean;
          commitment_hours: number | null; commitment_description: string | null;
          starts_at: string | null; ends_at: string | null;
          spots_total: number | null; spots_filled: number; is_remote: boolean;
          address_line1: string | null; city: string | null; state: string | null;
          postal_code: string | null; country: string | null;
          latitude: number | null; longitude: number | null;
          contact_name: string | null; contact_email: string | null; contact_phone: string | null;
          status: OpportunityStatus; is_featured: boolean;
          created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { org_id: string; created_by: string; title: string; category: string; tags?: string[]; is_recurring?: boolean; is_remote?: boolean; status?: OpportunityStatus; description?: string | null; short_description?: string | null; cover_image_url?: string | null; commitment_hours?: number | null; commitment_description?: string | null; starts_at?: string | null; ends_at?: string | null; spots_total?: number | null; address_line1?: string | null; city?: string | null; state?: string | null; postal_code?: string | null; country?: string | null; latitude?: number | null; longitude?: number | null; contact_name?: string | null; contact_email?: string | null; contact_phone?: string | null; is_featured?: boolean; deleted_at?: string | null };
        Update: { title?: string; description?: string | null; status?: OpportunityStatus; spots_total?: number | null; spots_filled?: number; is_featured?: boolean; deleted_at?: string | null };
        Relationships: [];
      };

      opportunity_steps: {
        Row: {
          id: string; opportunity_id: string; step_order: number; title: string;
          description: string | null; action_type: string; action_url: string | null; action_label: string | null;
        };
        Insert: { opportunity_id: string; step_order: number; title: string; action_type: string; description?: string | null; action_url?: string | null; action_label?: string | null };
        Update: { step_order?: number; title?: string; description?: string | null; action_type?: string; action_url?: string | null; action_label?: string | null };
        Relationships: [];
      };

      opportunity_responses: {
        Row: {
          id: string; opportunity_id: string; user_id: string; status: ResponseStatus;
          message: string | null; availability_notes: string | null; responded_at: string;
          reviewed_at: string | null; reviewed_by: string | null; reviewer_notes: string | null;
          completed_at: string | null; withdrawn_at: string | null;
        };
        Insert: { opportunity_id: string; user_id: string; status?: ResponseStatus; message?: string | null; availability_notes?: string | null };
        Update: { status?: ResponseStatus; reviewed_at?: string | null; reviewed_by?: string | null; reviewer_notes?: string | null; completed_at?: string | null; withdrawn_at?: string | null };
        Relationships: [];
      };

      testimonies: {
        Row: {
          id: string; author_id: string; org_id: string | null; event_id: string | null; opportunity_id: string | null;
          title: string; body: string; category: string; is_anonymous: boolean; media_urls: string[];
          status: ModerationStatus; moderated_by: string | null; moderated_at: string | null;
          rejection_reason: string | null; response_count: number; is_featured: boolean;
          created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { author_id: string; title: string; body: string; category: string; is_anonymous?: boolean; media_urls?: string[]; status?: ModerationStatus; org_id?: string | null; event_id?: string | null; opportunity_id?: string | null; moderated_by?: string | null; moderated_at?: string | null; rejection_reason?: string | null; is_featured?: boolean; deleted_at?: string | null };
        Update: { title?: string; body?: string; category?: string; is_anonymous?: boolean; status?: ModerationStatus; moderated_by?: string | null; moderated_at?: string | null; rejection_reason?: string | null; is_featured?: boolean; deleted_at?: string | null };
        Relationships: [];
      };

      testimony_responses: {
        Row: {
          id: string; testimony_id: string; author_id: string; body: string;
          status: ModerationStatus; moderated_by: string | null; moderated_at: string | null;
          rejection_reason: string | null; created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { testimony_id: string; author_id: string; body: string; status?: ModerationStatus; moderated_by?: string | null; moderated_at?: string | null; rejection_reason?: string | null; deleted_at?: string | null };
        Update: { body?: string; status?: ModerationStatus; moderated_by?: string | null; moderated_at?: string | null; rejection_reason?: string | null; deleted_at?: string | null };
        Relationships: [];
      };

      resources: {
        Row: {
          id: string; org_id: string | null; added_by: string; title: string;
          description: string | null; category: ResourceCategory; tags: string[];
          phone: string | null; email: string | null; website_url: string | null;
          file_url: string | null; file_type: string | null; file_size_bytes: number | null;
          is_national: boolean; city: string | null; state: string | null; country: string | null;
          status: ModerationStatus; is_featured: boolean; is_crisis: boolean;
          moderated_by: string | null; moderated_at: string | null;
          created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { org_id?: string | null; added_by: string; title: string; category: ResourceCategory; tags?: string[]; phone?: string | null; email?: string | null; website_url?: string | null; file_url?: string | null; file_type?: string | null; file_size_bytes?: number | null; is_national?: boolean; city?: string | null; state?: string | null; country?: string | null; status?: ModerationStatus; is_featured?: boolean; is_crisis?: boolean; description?: string | null; deleted_at?: string | null };
        Update: { title?: string; description?: string | null; category?: ResourceCategory; status?: ModerationStatus; is_featured?: boolean; is_crisis?: boolean; moderated_by?: string | null; moderated_at?: string | null; deleted_at?: string | null };
        Relationships: [];
      };

      conversations: {
        Row: {
          id: string; type: ConversationType; title: string | null;
          org_id: string | null; event_id: string | null; opportunity_id: string | null;
          created_by: string; last_message_at: string | null;
          created_at: string; updated_at: string; deleted_at: string | null;
        };
        Insert: { type?: ConversationType; title?: string | null; org_id?: string | null; event_id?: string | null; opportunity_id?: string | null; created_by: string; deleted_at?: string | null };
        Update: { title?: string | null; last_message_at?: string | null; deleted_at?: string | null };
        Relationships: [];
      };

      conversation_participants: {
        Row: {
          id: string; conversation_id: string; user_id: string; joined_at: string;
          left_at: string | null; last_read_at: string | null; is_admin: boolean; muted_until: string | null;
        };
        Insert: { conversation_id: string; user_id: string; is_admin?: boolean; muted_until?: string | null };
        Update: { left_at?: string | null; last_read_at?: string | null; is_admin?: boolean; muted_until?: string | null };
        Relationships: [];
      };

      messages: {
        Row: {
          id: string; conversation_id: string; sender_id: string;
          body: string | null; attachment_url: string | null; attachment_type: string | null;
          attachment_meta: Record<string, unknown> | null; reply_to_id: string | null;
          is_deleted: boolean; deleted_at: string | null; deleted_by: string | null;
          sent_at: string; edited_at: string | null;
        };
        Insert: { conversation_id: string; sender_id: string; body?: string | null; attachment_url?: string | null; attachment_type?: string | null; attachment_meta?: Record<string, unknown> | null; reply_to_id?: string | null };
        Update: { body?: string | null; is_deleted?: boolean; deleted_at?: string | null; deleted_by?: string | null; edited_at?: string | null };
        Relationships: [];
      };

      contributor_applications: {
        Row: {
          id: string; org_name: string; org_type: string; denomination: string | null;
          city: string | null; state: string | null; website_url: string | null;
          description: string; usage_intent: string | null;
          contact_name: string; contact_email: string; contact_phone: string | null;
          status: 'pending' | 'approved' | 'rejected';
          submitted_by: string | null; reviewed_by: string | null;
          reviewed_at: string | null; reviewer_notes: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { org_name: string; org_type: string; denomination?: string | null; city?: string | null; state?: string | null; website_url?: string | null; description: string; usage_intent?: string | null; contact_name: string; contact_email: string; contact_phone?: string | null; status?: 'pending' | 'approved' | 'rejected'; submitted_by?: string | null };
        Update: { status?: 'pending' | 'approved' | 'rejected'; reviewed_by?: string | null; reviewed_at?: string | null; reviewer_notes?: string | null };
        Relationships: [];
      };

      promoted_content: {
        Row: {
          id: string; promotable_type: PromotableType;
          org_id: string | null; event_id: string | null; opportunity_id: string | null;
          testimony_id: string | null; resource_id: string | null;
          slot_label: string; priority: number;
          starts_at: string | null; ends_at: string | null;
          is_active: boolean; created_by: string; notes: string | null;
        };
        Insert: { promotable_type: PromotableType; org_id?: string | null; event_id?: string | null; opportunity_id?: string | null; testimony_id?: string | null; resource_id?: string | null; slot_label: string; priority?: number; starts_at?: string | null; ends_at?: string | null; is_active?: boolean; created_by: string; notes?: string | null };
        Update: { slot_label?: string; priority?: number; starts_at?: string | null; ends_at?: string | null; is_active?: boolean; notes?: string | null };
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string; user_id: string; type: string; title: string; body: string;
          entity_type: string | null; entity_id: string | null; channel: NotificationChannel;
          is_read: boolean; read_at: string | null; sent_at: string | null; failed_at: string | null;
        };
        Insert: { user_id: string; type: string; title: string; body: string; entity_type?: string | null; entity_id?: string | null; channel: NotificationChannel; is_read?: boolean };
        Update: { is_read?: boolean; read_at?: string | null; failed_at?: string | null };
        Relationships: [];
      };

      notification_preferences: {
        Row: {
          user_id: string; notification_type: string;
          push_enabled: boolean; email_enabled: boolean; sms_enabled: boolean; in_app_enabled: boolean;
        };
        Insert: { user_id: string; notification_type: string; push_enabled?: boolean; email_enabled?: boolean; sms_enabled?: boolean; in_app_enabled?: boolean };
        Update: { push_enabled?: boolean; email_enabled?: boolean; sms_enabled?: boolean; in_app_enabled?: boolean };
        Relationships: [];
      };

      audit_log: {
        Row: {
          id: number; actor_id: string; action: string; entity_type: string;
          entity_id: string | null; payload: Record<string, unknown> | null;
          ip_address: string | null; user_agent: string | null; created_at: string;
        };
        Insert: { actor_id: string; action: string; entity_type: string; entity_id?: string | null; payload?: Record<string, unknown> | null; ip_address?: string | null; user_agent?: string | null };
        Update: never;
        Relationships: [];
      };

    };
    Views: {
      moderation_queue: {
        Row: {
          content_type: string; content_id: string; submitted_by: string;
          submitted_at: string; status: ModerationStatus; preview: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      is_org_member: { Args: { org: string; min_role?: OrgRole }; Returns: boolean };
    };
  };
}
