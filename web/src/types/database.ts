/**
 * TypeScript types generated from the LifeVine database schema.
 * Keep in sync with Supabase migrations.
 * Run `supabase gen types typescript --local > src/types/database.ts` to regenerate.
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
  | 'mental_health'
  | 'crisis'
  | 'housing'
  | 'food'
  | 'medical'
  | 'legal'
  | 'financial'
  | 'substance'
  | 'spiritual'
  | 'community'
  | 'other';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          phone: string | null;
          platform_role: PlatformRole;
          is_verified: boolean;
          is_banned: boolean;
          location_city: string | null;
          location_state: string | null;
          location_country: string;
          timezone: string;
          onboarding_complete: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          short_description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          website_url: string | null;
          phone: string | null;
          email: string | null;
          tier: OrgTier;
          is_verified: boolean;
          is_active: boolean;
          is_featured: boolean;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          category: string;
          tags: string[];
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          title: string;
          description: string | null;
          short_description: string | null;
          cover_image_url: string | null;
          category: string;
          tags: string[];
          is_virtual: boolean;
          virtual_url: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          max_attendees: number | null;
          is_public: boolean;
          status: ModerationStatus;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      opportunities: {
        Row: {
          id: string;
          org_id: string;
          created_by: string;
          title: string;
          description: string | null;
          short_description: string | null;
          cover_image_url: string | null;
          category: string;
          tags: string[];
          is_recurring: boolean;
          commitment_hours: number | null;
          commitment_description: string | null;
          starts_at: string | null;
          ends_at: string | null;
          spots_total: number | null;
          spots_filled: number;
          is_remote: boolean;
          address_line1: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          status: OpportunityStatus;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['opportunities']['Row'], 'id' | 'spots_filled' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>;
      };
      testimonies: {
        Row: {
          id: string;
          author_id: string;
          org_id: string | null;
          event_id: string | null;
          opportunity_id: string | null;
          title: string;
          body: string;
          category: string;
          is_anonymous: boolean;
          media_urls: string[];
          status: ModerationStatus;
          moderated_by: string | null;
          moderated_at: string | null;
          rejection_reason: string | null;
          response_count: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['testimonies']['Row'], 'id' | 'response_count' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['testimonies']['Insert']>;
      };
      resources: {
        Row: {
          id: string;
          org_id: string | null;
          added_by: string;
          title: string;
          description: string | null;
          category: ResourceCategory;
          tags: string[];
          phone: string | null;
          email: string | null;
          website_url: string | null;
          file_url: string | null;
          file_type: string | null;
          file_size_bytes: number | null;
          is_national: boolean;
          city: string | null;
          state: string | null;
          country: string | null;
          status: ModerationStatus;
          is_featured: boolean;
          is_crisis: boolean;
          moderated_by: string | null;
          moderated_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resources']['Insert']>;
      };
    };
    Views: {
      moderation_queue: {
        Row: {
          content_type: string;
          content_id: string;
          submitted_by: string;
          submitted_at: string;
          status: ModerationStatus;
          preview: string;
        };
      };
    };
    Functions: {
      is_super_admin: { Returns: boolean };
      is_org_member: { Args: { org: string; min_role?: OrgRole }; Returns: boolean };
    };
  };
}
