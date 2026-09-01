export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      athlete_bio_links: {
        Row: {
          athlete_id: string
          click_count: number
          created_at: string
          destination_app_url: string | null
          id: string
          is_published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          click_count?: number
          created_at?: string
          destination_app_url?: string | null
          id?: string
          is_published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          click_count?: number
          created_at?: string
          destination_app_url?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_bio_links_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_fan_apps: {
        Row: {
          app_name: string | null
          athlete_id: string
          config: Json
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          updated_at: string
          view_count: number
        }
        Insert: {
          app_name?: string | null
          athlete_id: string
          config?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          app_name?: string | null
          athlete_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_fan_apps_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_themes: {
        Row: {
          accent_color: string
          accent_hover: string
          athlete_id: string
          background_image: string | null
          bg_solid: string
          button_bg: string
          button_border_radius: number
          button_text: string
          created_at: string
          fan_app_name: string | null
          gradient_from: string
          gradient_to: string
          gradient_via: string
          headline: string | null
          is_published: boolean
          logo_url: string | null
          subheadline: string | null
          tagline: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          accent_hover?: string
          athlete_id: string
          background_image?: string | null
          bg_solid?: string
          button_bg?: string
          button_border_radius?: number
          button_text?: string
          created_at?: string
          fan_app_name?: string | null
          gradient_from?: string
          gradient_to?: string
          gradient_via?: string
          headline?: string | null
          is_published?: boolean
          logo_url?: string | null
          subheadline?: string | null
          tagline?: string | null
          template_id?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          accent_hover?: string
          athlete_id?: string
          background_image?: string | null
          bg_solid?: string
          button_bg?: string
          button_border_radius?: number
          button_text?: string
          created_at?: string
          fan_app_name?: string | null
          gradient_from?: string
          gradient_to?: string
          gradient_via?: string
          headline?: string | null
          is_published?: boolean
          logo_url?: string | null
          subheadline?: string | null
          tagline?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_themes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          bio_short: string | null
          competition_level: string | null
          created_at: string
          display_name: string | null
          full_name: string
          gender: string | null
          id: string
          league: string | null
          onboarding_completed: boolean
          position: string | null
          profile_key: string | null
          profile_photo_url: string | null
          sport: string | null
          sport_icon: string | null
          team_or_league: string | null
          updated_at: string
        }
        Insert: {
          bio_short?: string | null
          competition_level?: string | null
          created_at?: string
          display_name?: string | null
          full_name: string
          gender?: string | null
          id?: string
          league?: string | null
          onboarding_completed?: boolean
          position?: string | null
          profile_key?: string | null
          profile_photo_url?: string | null
          sport?: string | null
          sport_icon?: string | null
          team_or_league?: string | null
          updated_at?: string
        }
        Update: {
          bio_short?: string | null
          competition_level?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          league?: string | null
          onboarding_completed?: boolean
          position?: string | null
          profile_key?: string | null
          profile_photo_url?: string | null
          sport?: string | null
          sport_icon?: string | null
          team_or_league?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_state: {
        Row: {
          completed_at: string | null
          created_at: string
          has_completed_onboarding: boolean
          profile_key: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          has_completed_onboarding?: boolean
          profile_key: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          has_completed_onboarding?: boolean
          profile_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_connections: {
        Row: {
          athlete_id: string | null
          connected: boolean
          created_at: string
          display_name: string
          follower_count: number | null
          handle: string | null
          id: string
          last_synced_at: string | null
          platform: string
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          connected?: boolean
          created_at?: string
          display_name: string
          follower_count?: number | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          platform: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          connected?: boolean
          created_at?: string
          display_name?: string
          follower_count?: number | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_follower_snapshots: {
        Row: {
          athlete_id: string | null
          captured_on: string
          created_at: string
          follower_count: number
          id: string
          platform: string
        }
        Insert: {
          athlete_id?: string | null
          captured_on?: string
          created_at?: string
          follower_count: number
          id?: string
          platform: string
        }
        Update: {
          athlete_id?: string | null
          captured_on?: string
          created_at?: string
          follower_count?: number
          id?: string
          platform?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
