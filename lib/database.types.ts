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
      boards: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          slug: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          slug?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          slug?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          body: string
          created_at: string
          id: string
          published_at: string | null
          roadmap_item_id: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          published_at?: string | null
          roadmap_item_id?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          published_at?: string | null
          roadmap_item_id?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "changelog_roadmap_fk"
            columns: ["roadmap_item_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      feedback_comments: {
        Row: {
          author_id: string | null
          author_name_snapshot: string | null
          body: string
          created_at: string
          feedback_id: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean
          is_staff: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          author_name_snapshot?: string | null
          body: string
          created_at?: string
          feedback_id: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          is_staff?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          author_name_snapshot?: string | null
          body?: string
          created_at?: string
          feedback_id?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean
          is_staff?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comment_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_comment_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_comments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_duplicate_links: {
        Row: {
          created_at: string
          duplicate_id: string
          feedback_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity: number
          state: Database["public"]["Enums"]["link_state"]
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duplicate_id: string
          feedback_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity: number
          state?: Database["public"]["Enums"]["link_state"]
          workspace_id: string
        }
        Update: {
          created_at?: string
          duplicate_id?: string
          feedback_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity?: number
          state?: Database["public"]["Enums"]["link_state"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_candidate_fk"
            columns: ["duplicate_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "duplicate_candidate_fk"
            columns: ["duplicate_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "duplicate_feedback_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "duplicate_feedback_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_duplicate_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_message: string | null
          failed_rows: number
          filename: string
          id: string
          imported_rows: number
          state: Database["public"]["Enums"]["import_state"]
          total_rows: number
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          failed_rows?: number
          filename: string
          id?: string
          imported_rows?: number
          state?: Database["public"]["Enums"]["import_state"]
          total_rows?: number
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          failed_rows?: number
          filename?: string
          id?: string
          imported_rows?: number
          state?: Database["public"]["Enums"]["import_state"]
          total_rows?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_imports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_posts: {
        Row: {
          author_id: string | null
          author_name_snapshot: string | null
          board_id: string
          body: string
          created_at: string
          duplicate_of_id: string | null
          embedding: string | null
          embedding_error: string | null
          embedding_state: Database["public"]["Enums"]["embedding_state"]
          external_id: string | null
          id: string
          import_id: string | null
          import_row_index: number | null
          search_document: unknown
          source: Database["public"]["Enums"]["feedback_source"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          author_name_snapshot?: string | null
          board_id: string
          body: string
          created_at?: string
          duplicate_of_id?: string | null
          embedding?: string | null
          embedding_error?: string | null
          embedding_state?: Database["public"]["Enums"]["embedding_state"]
          external_id?: string | null
          id?: string
          import_id?: string | null
          import_row_index?: number | null
          search_document?: unknown
          source?: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feedback_visibility"]
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          author_name_snapshot?: string | null
          board_id?: string
          body?: string
          created_at?: string
          duplicate_of_id?: string | null
          embedding?: string | null
          embedding_error?: string | null
          embedding_state?: Database["public"]["Enums"]["embedding_state"]
          external_id?: string | null
          id?: string
          import_id?: string | null
          import_row_index?: number | null
          search_document?: unknown
          source?: Database["public"]["Enums"]["feedback_source"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["feedback_visibility"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_board_workspace_fk"
            columns: ["board_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_import_fk"
            columns: ["import_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_imports"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_posts_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_posts_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_subscriptions: {
        Row: {
          created_at: string
          email: string
          feedback_id: string
          id: string
          is_active: boolean
          unsubscribed_at: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          feedback_id: string
          id?: string
          is_active?: boolean
          unsubscribed_at?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          feedback_id?: string
          id?: string
          is_active?: boolean
          unsubscribed_at?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_feedback_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "subscription_feedback_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      feedback_theme_links: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          similarity: number
          state: Database["public"]["Enums"]["link_state"]
          theme_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity: number
          state?: Database["public"]["Enums"]["link_state"]
          theme_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          similarity?: number
          state?: Database["public"]["Enums"]["link_state"]
          theme_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_theme_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_theme_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_theme_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_theme_theme_fk"
            columns: ["theme_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "theme_summary"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_theme_theme_fk"
            columns: ["theme_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_vote_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_vote_post_fk"
            columns: ["feedback_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_votes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          created_at: string
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["roadmap_status"]
          summary: string
          target_window: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          summary: string
          target_window?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["roadmap_status"]
          summary?: string
          target_window?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_theme_links: {
        Row: {
          created_at: string
          roadmap_item_id: string
          theme_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          roadmap_item_id: string
          theme_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          roadmap_item_id?: string
          theme_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_theme_item_fk"
            columns: ["roadmap_item_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "roadmap_theme_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_theme_theme_fk"
            columns: ["theme_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "theme_summary"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "roadmap_theme_theme_fk"
            columns: ["theme_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          description: string
          embedding: string | null
          embedding_state: Database["public"]["Enums"]["embedding_state"]
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description: string
          embedding?: string | null
          embedding_state?: Database["public"]["Enums"]["embedding_state"]
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string
          embedding?: string | null
          embedding_state?: Database["public"]["Enums"]["embedding_state"]
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "themes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token_hash: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token_hash: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token_hash?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_demo: boolean
          is_public: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_demo?: boolean
          is_public?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_demo?: boolean
          is_public?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      feedback_feed: {
        Row: {
          author_initials: string | null
          author_name: string | null
          board_id: string | null
          body: string | null
          comment_count: number | null
          confirmed_theme_id: string | null
          created_at: string | null
          duplicate_of_id: string | null
          embedding_state: Database["public"]["Enums"]["embedding_state"] | null
          id: string | null
          source: Database["public"]["Enums"]["feedback_source"] | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          title: string | null
          visibility: Database["public"]["Enums"]["feedback_visibility"] | null
          vote_count: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_board_workspace_fk"
            columns: ["board_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "feedback_posts_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "feedback_feed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_posts_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "feedback_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_summary: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          signal_count: number | null
          velocity: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "themes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token_hash: string }
        Returns: {
          role: Database["public"]["Enums"]["workspace_role"]
          workspace_id: string
        }[]
      }
      claim_email_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          event_type: string
          feedback_id: string
          id: number
          idempotency_key: string
          payload: Json
          recipient: string
          subscription_id: string
          workspace_id: string
        }[]
      }
      complete_email_job: { Args: { p_id: number }; Returns: undefined }
      create_unsubscribe_token: {
        Args: { p_subscription_id: string }
        Returns: string
      }
      delete_analysis_job: { Args: { p_msg_id: number }; Returns: boolean }
      fail_email_job: {
        Args: { p_error: string; p_id: number }
        Returns: undefined
      }
      find_duplicate_suggestions: {
        Args: { p_count?: number; p_feedback_id: string; p_threshold?: number }
        Returns: number
      }
      find_public_feedback_matches: {
        Args: {
          p_body: string
          p_limit?: number
          p_title: string
          p_workspace_id: string
        }
        Returns: {
          body: string
          id: string
          rank: number
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          vote_count: number
        }[]
      }
      find_theme_suggestions: {
        Args: { p_count?: number; p_feedback_id: string; p_threshold?: number }
        Returns: number
      }
      get_feedback_detail: {
        Args: { p_feedback_id: string; p_workspace_id: string }
        Returns: {
          author_name: string
          body: string
          canonical_title: string
          comment_count: number
          confirmed_theme_id: string
          created_at: string
          duplicate_of_id: string
          embedding_state: Database["public"]["Enums"]["embedding_state"]
          id: string
          source: Database["public"]["Enums"]["feedback_source"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
          vote_count: number
          voted_by_viewer: boolean
          workspace_id: string
        }[]
      }
      list_feedback: {
        Args: {
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_limit?: number
          p_query?: string
          p_status?: Database["public"]["Enums"]["feedback_status"]
          p_workspace_id: string
        }
        Returns: {
          author_name: string
          body: string
          canonical_title: string
          comment_count: number
          confirmed_theme_id: string
          created_at: string
          duplicate_of_id: string
          embedding_state: Database["public"]["Enums"]["embedding_state"]
          id: string
          source: Database["public"]["Enums"]["feedback_source"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          visibility: Database["public"]["Enums"]["feedback_visibility"]
          vote_count: number
          voted_by_viewer: boolean
          workspace_id: string
        }[]
      }
      list_roadmap: {
        Args: { p_workspace_id: string }
        Returns: {
          feedback_count: number
          id: string
          status: Database["public"]["Enums"]["roadmap_status"]
          summary: string
          target_window: string
          theme_ids: string[]
          title: string
          workspace_id: string
        }[]
      }
      unsubscribe_feedback: { Args: { p_token: string }; Returns: boolean }
      update_roadmap_status: {
        Args: {
          p_confirm?: boolean
          p_item_id: string
          p_status: Database["public"]["Enums"]["roadmap_status"]
        }
        Returns: {
          affected_feedback: number
          updated: boolean
        }[]
      }
      validate_worker_secret: { Args: { p_secret: string }; Returns: boolean }
    }
    Enums: {
      embedding_state: "pending" | "ready" | "failed"
      feedback_source:
        | "portal"
        | "email"
        | "interview"
        | "support"
        | "manual"
        | "csv"
      feedback_status:
        | "new"
        | "under_review"
        | "planned"
        | "in_progress"
        | "shipped"
        | "closed"
      feedback_visibility: "published" | "hidden" | "merged"
      import_state:
        | "pending"
        | "processing"
        | "completed"
        | "completed_with_errors"
        | "failed"
      job_state: "pending" | "processing" | "sent" | "failed"
      link_state: "suggested" | "confirmed" | "rejected"
      roadmap_status: "planned" | "in_progress" | "shipped"
      workspace_role: "owner" | "editor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      embedding_state: ["pending", "ready", "failed"],
      feedback_source: [
        "portal",
        "email",
        "interview",
        "support",
        "manual",
        "csv",
      ],
      feedback_status: [
        "new",
        "under_review",
        "planned",
        "in_progress",
        "shipped",
        "closed",
      ],
      feedback_visibility: ["published", "hidden", "merged"],
      import_state: [
        "pending",
        "processing",
        "completed",
        "completed_with_errors",
        "failed",
      ],
      job_state: ["pending", "processing", "sent", "failed"],
      link_state: ["suggested", "confirmed", "rejected"],
      roadmap_status: ["planned", "in_progress", "shipped"],
      workspace_role: ["owner", "editor"],
    },
  },
} as const

