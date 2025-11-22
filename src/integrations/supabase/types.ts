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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contact_field_shares: {
        Row: {
          contact_user_id: string
          created_at: string | null
          field_name: string
          id: string
          user_id: string
        }
        Insert: {
          contact_user_id: string
          created_at?: string | null
          field_name: string
          id?: string
          user_id: string
        }
        Update: {
          contact_user_id?: string
          created_at?: string | null
          field_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_dial_values: {
        Row: {
          created_at: string | null
          custom_dial_id: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_dial_id: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_dial_id?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_dial_values_custom_dial_id_fkey"
            columns: ["custom_dial_id"]
            isOneToOne: false
            referencedRelation: "custom_dials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_dial_values_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dials: {
        Row: {
          content_type: string
          created_at: string | null
          dial_language: string | null
          dial_name: string
          id: string
          normalized_name: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          dial_language?: string | null
          dial_name: string
          id?: string
          normalized_name?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          dial_language?: string | null
          dial_name?: string
          id?: string
          normalized_name?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      dial_translations: {
        Row: {
          created_at: string | null
          id: string
          similarity_score: number | null
          source_dial_id: string
          target_dial_id: string
          translation_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          similarity_score?: number | null
          source_dial_id: string
          target_dial_id: string
          translation_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          similarity_score?: number | null
          source_dial_id?: string
          target_dial_id?: string
          translation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dial_translations_source_dial_id_fkey"
            columns: ["source_dial_id"]
            isOneToOne: false
            referencedRelation: "custom_dials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dial_translations_target_dial_id_fkey"
            columns: ["target_dial_id"]
            isOneToOne: false
            referencedRelation: "custom_dials"
            referencedColumns: ["id"]
          },
        ]
      }
      file_comments: {
        Row: {
          comment: string
          created_at: string
          file_id: string
          id: string
          timestamp_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          file_id: string
          id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          file_id?: string
          id?: string
          timestamp_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_comments_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_shares: {
        Row: {
          access_level: string
          created_at: string
          file_id: string
          id: string
          shared_by: string
          shared_with: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          file_id: string
          id?: string
          shared_by: string
          shared_with: string
        }
        Update: {
          access_level?: string
          created_at?: string
          file_id?: string
          id?: string
          shared_by?: string
          shared_with?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_shares_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          coupling_strength: number | null
          created_at: string
          duration: number | null
          file_size: number
          file_type: string
          id: string
          interaction_potential: number | null
          is_public: boolean | null
          mime_type: string | null
          original_name: string
          owner_id: string
          p_value: number | null
          reference_chain: Json | null
          rotation_axis: string | null
          rotation_enabled: boolean | null
          rotation_speed: number | null
          share_slug: string | null
          show_360: boolean | null
          show_play_all_button: boolean | null
          storage_path: string
          thumbnail_path: string | null
          updated_at: string
          view_count: number | null
          x_axis_offset: number | null
          y_axis_offset: number | null
        }
        Insert: {
          coupling_strength?: number | null
          created_at?: string
          duration?: number | null
          file_size: number
          file_type: string
          id?: string
          interaction_potential?: number | null
          is_public?: boolean | null
          mime_type?: string | null
          original_name: string
          owner_id: string
          p_value?: number | null
          reference_chain?: Json | null
          rotation_axis?: string | null
          rotation_enabled?: boolean | null
          rotation_speed?: number | null
          share_slug?: string | null
          show_360?: boolean | null
          show_play_all_button?: boolean | null
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string
          view_count?: number | null
          x_axis_offset?: number | null
          y_axis_offset?: number | null
        }
        Update: {
          coupling_strength?: number | null
          created_at?: string
          duration?: number | null
          file_size?: number
          file_type?: string
          id?: string
          interaction_potential?: number | null
          is_public?: boolean | null
          mime_type?: string | null
          original_name?: string
          owner_id?: string
          p_value?: number | null
          reference_chain?: Json | null
          rotation_axis?: string | null
          rotation_enabled?: boolean | null
          rotation_speed?: number | null
          share_slug?: string | null
          show_360?: boolean | null
          show_play_all_button?: boolean | null
          storage_path?: string
          thumbnail_path?: string | null
          updated_at?: string
          view_count?: number | null
          x_axis_offset?: number | null
          y_axis_offset?: number | null
        }
        Relationships: []
      }
      item_connections: {
        Row: {
          coupling_strength: number | null
          created_at: string
          created_by: string
          from_item_id: string
          id: string
          semantic_similarity: number | null
          to_item_id: string
          updated_at: string
        }
        Insert: {
          coupling_strength?: number | null
          created_at?: string
          created_by: string
          from_item_id: string
          id?: string
          semantic_similarity?: number | null
          to_item_id: string
          updated_at?: string
        }
        Update: {
          coupling_strength?: number | null
          created_at?: string
          created_by?: string
          from_item_id?: string
          id?: string
          semantic_similarity?: number | null
          to_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_connections_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_connections_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      item_metadata: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          created_at: string
          detected_location: Json | null
          detected_objects: Json | null
          detected_people: Json | null
          dial_values: Json | null
          file_id: string
          hashtags: string[] | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          created_at?: string
          detected_location?: Json | null
          detected_objects?: Json | null
          detected_people?: Json | null
          dial_values?: Json | null
          file_id: string
          hashtags?: string[] | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          created_at?: string
          detected_location?: Json | null
          detected_objects?: Json | null
          detected_people?: Json | null
          dial_values?: Json | null
          file_id?: string
          hashtags?: string[] | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_metadata_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      item_pointers: {
        Row: {
          added_at: string
          hidden: boolean
          id: string
          item_id: string
          permissions: Json | null
          position: number | null
          render_properties: Json | null
          shared_by_user_id: string
          space_id: string
          upstream_pointer_id: string | null
        }
        Insert: {
          added_at?: string
          hidden?: boolean
          id?: string
          item_id: string
          permissions?: Json | null
          position?: number | null
          render_properties?: Json | null
          shared_by_user_id: string
          space_id: string
          upstream_pointer_id?: string | null
        }
        Update: {
          added_at?: string
          hidden?: boolean
          id?: string
          item_id?: string
          permissions?: Json | null
          position?: number | null
          render_properties?: Json | null
          shared_by_user_id?: string
          space_id?: string
          upstream_pointer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_pointers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_pointers_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_pointers_upstream_pointer_id_fkey"
            columns: ["upstream_pointer_id"]
            isOneToOne: false
            referencedRelation: "item_pointers"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          original_name: string
          owner_id: string
          uip_metrics: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_name: string
          owner_id: string
          uip_metrics?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          original_name?: string
          owner_id?: string
          uip_metrics?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profile_media_history: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          address_public: boolean | null
          bio: string | null
          bio_public: boolean | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          email_public: boolean | null
          full_name: string | null
          full_name_public: boolean | null
          id: string
          phone: string | null
          phone_public: boolean | null
          profile_media_public: boolean | null
          profile_media_type: string | null
          profile_media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          address_public?: boolean | null
          bio?: string | null
          bio_public?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          email_public?: boolean | null
          full_name?: string | null
          full_name_public?: boolean | null
          id?: string
          phone?: string | null
          phone_public?: boolean | null
          profile_media_public?: boolean | null
          profile_media_type?: string | null
          profile_media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          address_public?: boolean | null
          bio?: string | null
          bio_public?: boolean | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          email_public?: boolean | null
          full_name?: string | null
          full_name_public?: boolean | null
          id?: string
          phone?: string | null
          phone_public?: boolean | null
          profile_media_public?: boolean | null
          profile_media_type?: string | null
          profile_media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      space_connections: {
        Row: {
          coupling_strength: number | null
          created_at: string
          created_by: string
          from_space_id: string
          id: string
          interaction_data: Json | null
          to_space_id: string
        }
        Insert: {
          coupling_strength?: number | null
          created_at?: string
          created_by: string
          from_space_id: string
          id?: string
          interaction_data?: Json | null
          to_space_id: string
        }
        Update: {
          coupling_strength?: number | null
          created_at?: string
          created_by?: string
          from_space_id?: string
          id?: string
          interaction_data?: Json | null
          to_space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_connections_from_space_id_fkey"
            columns: ["from_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_connections_to_space_id_fkey"
            columns: ["to_space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_files: {
        Row: {
          added_at: string
          added_by: string
          file_id: string
          hidden: boolean
          id: string
          position: number | null
          space_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          file_id: string
          hidden?: boolean
          id?: string
          position?: number | null
          space_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          file_id?: string
          hidden?: boolean
          id?: string
          position?: number | null
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_files_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          last_seen_at: string | null
          phase_coupling_score: number | null
          role: string | null
          space_id: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string | null
          phase_coupling_score?: number | null
          role?: string | null
          space_id: string
          user_id: string
        }
        Update: {
          last_seen_at?: string | null
          phase_coupling_score?: number | null
          role?: string | null
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_metadata: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          created_at: string
          detected_objects: Json | null
          dial_values: Json | null
          hashtags: string[] | null
          id: string
          space_id: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          created_at?: string
          detected_objects?: Json | null
          dial_values?: Json | null
          hashtags?: string[] | null
          id?: string
          space_id: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          created_at?: string
          detected_objects?: Json | null
          dial_values?: Json | null
          hashtags?: string[] | null
          id?: string
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_metadata_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          coupling_strength: number | null
          cover_url: string | null
          created_at: string
          creator_id: string | null
          description: string | null
          dial_values: Json | null
          environment_settings: Json | null
          flip_horizontal: boolean | null
          flip_vertical: boolean | null
          hashtags: string[] | null
          horizontal_flip: boolean | null
          id: string
          interaction_potential: number | null
          is_home: boolean
          is_muted: boolean | null
          is_public: boolean | null
          name: string
          p_value: number | null
          parent_id: string | null
          position: number | null
          reference_chain: Json | null
          rotation_axis: string | null
          rotation_enabled: boolean | null
          rotation_speed: number | null
          share_slug: string | null
          show_360: boolean | null
          show_play_all_button: boolean | null
          space_type: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          vertical_flip: boolean | null
          volume: number | null
          x_axis_offset: number | null
          y_axis_offset: number | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          coupling_strength?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dial_values?: Json | null
          environment_settings?: Json | null
          flip_horizontal?: boolean | null
          flip_vertical?: boolean | null
          hashtags?: string[] | null
          horizontal_flip?: boolean | null
          id?: string
          interaction_potential?: number | null
          is_home?: boolean
          is_muted?: boolean | null
          is_public?: boolean | null
          name: string
          p_value?: number | null
          parent_id?: string | null
          position?: number | null
          reference_chain?: Json | null
          rotation_axis?: string | null
          rotation_enabled?: boolean | null
          rotation_speed?: number | null
          share_slug?: string | null
          show_360?: boolean | null
          show_play_all_button?: boolean | null
          space_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          vertical_flip?: boolean | null
          volume?: number | null
          x_axis_offset?: number | null
          y_axis_offset?: number | null
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          coupling_strength?: number | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string | null
          description?: string | null
          dial_values?: Json | null
          environment_settings?: Json | null
          flip_horizontal?: boolean | null
          flip_vertical?: boolean | null
          hashtags?: string[] | null
          horizontal_flip?: boolean | null
          id?: string
          interaction_potential?: number | null
          is_home?: boolean
          is_muted?: boolean | null
          is_public?: boolean | null
          name?: string
          p_value?: number | null
          parent_id?: string | null
          position?: number | null
          reference_chain?: Json | null
          rotation_axis?: string | null
          rotation_enabled?: boolean | null
          rotation_speed?: number | null
          share_slug?: string | null
          show_360?: boolean | null
          show_play_all_button?: boolean | null
          space_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          vertical_flip?: boolean | null
          volume?: number | null
          x_axis_offset?: number | null
          y_axis_offset?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["interaction_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["interaction_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["interaction_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_semantic_layer: {
        Row: {
          created_at: string | null
          detected_objects: Json | null
          detected_people: Json | null
          dial_values: Json | null
          file_id: string | null
          file_type: string | null
          hashtags: string[] | null
          space_dial_values: Json | null
          space_hashtags: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "item_metadata_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      append_reference: {
        Args: { current_chain: Json; new_ref: Json }
        Returns: Json
      }
      calculate_coupling_strength: {
        Args: { _from_space_id: string; _to_space_id: string }
        Returns: number
      }
      calculate_interaction_potential: {
        Args: { p_val: number }
        Returns: number
      }
      calculate_item_similarity: {
        Args: { _from_item_id: string; _to_item_id: string }
        Returns: number
      }
      check_access_chain: {
        Args: { _item_id: string; _user_id: string }
        Returns: boolean
      }
      file_shared_with_user: {
        Args: { _file_id: string; _user_id: string }
        Returns: boolean
      }
      generate_share_slug: { Args: { space_name: string }; Returns: string }
      get_trending_dials: {
        Args: { p_content_type: string; p_days?: number; p_limit?: number }
        Returns: {
          dial_id: string
          dial_name: string
          recent_usage_count: number
          total_usage_count: number
          trend_score: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["interaction_role"]
      }
      refresh_public_semantic_layer: { Args: never; Returns: undefined }
      user_owns_file: {
        Args: { _file_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      interaction_role: "artist" | "viewer" | "creator"
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
    Enums: {
      interaction_role: ["artist", "viewer", "creator"],
    },
  },
} as const
