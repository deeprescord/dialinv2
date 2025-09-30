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
          created_at: string
          duration: number | null
          file_size: number
          file_type: string
          id: string
          mime_type: string | null
          original_name: string
          owner_id: string
          storage_path: string
          thumbnail_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_size: number
          file_type: string
          id?: string
          mime_type?: string | null
          original_name: string
          owner_id: string
          storage_path: string
          thumbnail_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_size?: number
          file_type?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          owner_id?: string
          storage_path?: string
          thumbnail_path?: string | null
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
      space_files: {
        Row: {
          added_at: string
          added_by: string
          file_id: string
          id: string
          space_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          file_id: string
          id?: string
          space_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          file_id?: string
          id?: string
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
      spaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
