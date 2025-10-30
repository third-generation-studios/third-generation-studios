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
      album_images: {
        Row: {
          album_id: string
          created_at: string
          id: string
          name: string
          url: string
        }
        Insert: {
          album_id: string
          created_at?: string
          id?: string
          name?: string
          url: string
        }
        Update: {
          album_id?: string
          created_at?: string
          id?: string
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_images_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          name: string
          release_date: string
          type: Database["public"]["Enums"]["album_type"]
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          name: string
          release_date: string
          type: Database["public"]["Enums"]["album_type"]
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          name?: string
          release_date?: string
          type?: Database["public"]["Enums"]["album_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          active: boolean
          apple_music_url: string | null
          created_at: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          links: Json | null
          profile_image_url: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          stage_name: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          verified: boolean
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          active?: boolean
          apple_music_url?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          links?: Json | null
          profile_image_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stage_name: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          active?: boolean
          apple_music_url?: string | null
          created_at?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          links?: Json | null
          profile_image_url?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stage_name?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_id_fkey1"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      download_links: {
        Row: {
          created_at: string
          download_url: string
          expires_at: string
          id: string
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_url: string
          expires_at: string
          id?: string
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_url?: string
          expires_at?: string
          id?: string
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_links_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "download_links_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          recipient_email: string
          sender_id: string
          status: string
          track_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          message?: string | null
          recipient_email: string
          sender_id: string
          status?: string
          track_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          recipient_email?: string
          sender_id?: string
          status?: string
          track_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_likes: {
        Row: {
          id: string
          liked_at: string | null
          playlist_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          liked_at?: string | null
          playlist_id: string
          profile_id: string
        }
        Update: {
          id?: string
          liked_at?: string | null
          playlist_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_likes_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string | null
          added_by: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          id?: string
          playlist_id: string
          position: number
          track_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          total_duration: number | null
          track_count: number | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          total_duration?: number | null
          track_count?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          total_duration?: number | null
          track_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playlists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      remixes: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          original_artists: Json | null
          original_song: string
          track_id: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          original_artists?: Json | null
          original_song: string
          track_id: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          original_artists?: Json | null
          original_song?: string
          track_id?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remixes_remixer_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remixes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_credits: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          performed_by: string[] | null
          produced_by: string[] | null
          remixed_by: string[] | null
          track_id: string
          updated_at: string
          written_by: string[] | null
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          performed_by?: string[] | null
          produced_by?: string[] | null
          remixed_by?: string[] | null
          track_id: string
          updated_at?: string
          written_by?: string[] | null
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          performed_by?: string[] | null
          produced_by?: string[] | null
          remixed_by?: string[] | null
          track_id?: string
          updated_at?: string
          written_by?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "track_credits_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_credits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_likes_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: string
          artist_id: string
          created_at: string
          duration: number
          genre: string | null
          id: string
          is_public: boolean
          links: Json | null
          locked: boolean
          lyrics: string | null
          plays: number
          release_date: string | null
          title: string
          type: Database["public"]["Enums"]["track_type"] | null
          updated_at: string
          url: string
          url_refreshed_at: string | null
        }
        Insert: {
          album_id: string
          artist_id: string
          created_at?: string
          duration: number
          genre?: string | null
          id?: string
          is_public?: boolean
          links?: Json | null
          locked?: boolean
          lyrics?: string | null
          plays?: number
          release_date?: string | null
          title: string
          type?: Database["public"]["Enums"]["track_type"] | null
          updated_at?: string
          url: string
          url_refreshed_at?: string | null
        }
        Update: {
          album_id?: string
          artist_id?: string
          created_at?: string
          duration?: number
          genre?: string | null
          id?: string
          is_public?: boolean
          links?: Json | null
          locked?: boolean
          lyrics?: string | null
          plays?: number
          release_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["track_type"] | null
          updated_at?: string
          url?: string
          url_refreshed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_album_bundle: { Args: { payload: Json }; Returns: Json }
      increment_track_play: { Args: { track_id: string }; Returns: undefined }
      uid_cached: { Args: never; Returns: string }
    }
    Enums: {
      album_type: "Single" | "Remix" | "Album"
      credit_role_type:
        | "composer"
        | "producer"
        | "lyricist"
        | "featured-artist"
        | "main-artist"
      profile_role: "listener" | "admin" | "artist"
      track_type:
        | "Released"
        | "Unreleased"
        | "Work In Progress"
        | "Demo"
        | "Remix"
      verification_status: "active" | "inactive" | "banned"
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
      album_type: ["Single", "Remix", "Album"],
      credit_role_type: [
        "composer",
        "producer",
        "lyricist",
        "featured-artist",
        "main-artist",
      ],
      profile_role: ["listener", "admin", "artist"],
      track_type: [
        "Released",
        "Unreleased",
        "Work In Progress",
        "Demo",
        "Remix",
      ],
      verification_status: ["active", "inactive", "banned"],
    },
  },
} as const
