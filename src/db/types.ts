export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      feedback_comments: {
        Row: {
          comment_id: string;
          content: string;
          created_at: string;
          feedback_id: string;
          is_official: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          content: string;
          created_at?: string;
          feedback_id: string;
          is_official?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          content?: string;
          created_at?: string;
          feedback_id?: string;
          is_official?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_comments_feedback_id_fkey';
            columns: ['feedback_id'];
            isOneToOne: false;
            referencedRelation: 'feedbacks';
            referencedColumns: ['feedback_id'];
          },
          {
            foreignKeyName: 'feedback_comments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      feedback_votes: {
        Row: {
          created_at: string;
          feedback_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'feedback_votes_feedback_id_fkey';
            columns: ['feedback_id'];
            isOneToOne: false;
            referencedRelation: 'feedbacks';
            referencedColumns: ['feedback_id'];
          },
          {
            foreignKeyName: 'feedback_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      feedbacks: {
        Row: {
          admin_note: string | null;
          browser_info: string | null;
          category: Database['public']['Enums']['feedback_category'];
          created_at: string;
          description: string;
          feedback_id: string;
          merged_into_id: string | null;
          page_url: string | null;
          priority: Database['public']['Enums']['feedback_priority'] | null;
          resolved_at: string | null;
          screenshot_url: string | null;
          status: Database['public']['Enums']['feedback_status'];
          title: string;
          updated_at: string;
          user_id: string;
          vote_count: number;
        };
        Insert: {
          admin_note?: string | null;
          browser_info?: string | null;
          category?: Database['public']['Enums']['feedback_category'];
          created_at?: string;
          description: string;
          feedback_id: string;
          merged_into_id?: string | null;
          page_url?: string | null;
          priority?: Database['public']['Enums']['feedback_priority'] | null;
          resolved_at?: string | null;
          screenshot_url?: string | null;
          status?: Database['public']['Enums']['feedback_status'];
          title: string;
          updated_at?: string;
          user_id: string;
          vote_count?: number;
        };
        Update: {
          admin_note?: string | null;
          browser_info?: string | null;
          category?: Database['public']['Enums']['feedback_category'];
          created_at?: string;
          description?: string;
          feedback_id?: string;
          merged_into_id?: string | null;
          page_url?: string | null;
          priority?: Database['public']['Enums']['feedback_priority'] | null;
          resolved_at?: string | null;
          screenshot_url?: string | null;
          status?: Database['public']['Enums']['feedback_status'];
          title?: string;
          updated_at?: string;
          user_id?: string;
          vote_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'feedbacks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      game_schedules: {
        Row: {
          created_at: string;
          schedule_date: string;
          schedule_phase: Database['public']['Enums']['schedule_phase'];
          session_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          schedule_date: string;
          schedule_phase?: Database['public']['Enums']['schedule_phase'];
          session_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          schedule_date?: string;
          schedule_phase?: Database['public']['Enums']['schedule_phase'];
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_schedules_session_id_game_sessions_game_session_id_fk';
            columns: ['session_id'];
            isOneToOne: true;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
        ];
      };
      game_sessions: {
        Row: {
          completion_note: string | null;
          created_at: string;
          game_session_id: string;
          is_beginner_friendly: boolean;
          keeper_id: string | null;
          recruited_player_count: number | null;
          scenario_id: string | null;
          scheduled_at: string | null;
          session_description: string;
          session_memo: string | null;
          session_name: string;
          session_phase: Database['public']['Enums']['session_phase'];
          tools: string | null;
          updated_at: string;
          visibility: Database['public']['Enums']['session_visibility'];
        };
        Insert: {
          completion_note?: string | null;
          created_at?: string;
          game_session_id: string;
          is_beginner_friendly?: boolean;
          keeper_id?: string | null;
          recruited_player_count?: number | null;
          scenario_id?: string | null;
          scheduled_at?: string | null;
          session_description?: string;
          session_memo?: string | null;
          session_name: string;
          session_phase?: Database['public']['Enums']['session_phase'];
          tools?: string | null;
          updated_at?: string;
          visibility?: Database['public']['Enums']['session_visibility'];
        };
        Update: {
          completion_note?: string | null;
          created_at?: string;
          game_session_id?: string;
          is_beginner_friendly?: boolean;
          keeper_id?: string | null;
          recruited_player_count?: number | null;
          scenario_id?: string | null;
          scheduled_at?: string | null;
          session_description?: string;
          session_memo?: string | null;
          session_name?: string;
          session_phase?: Database['public']['Enums']['session_phase'];
          tools?: string | null;
          updated_at?: string;
          visibility?: Database['public']['Enums']['session_visibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'game_sessions_keeper_id_users_user_id_fk';
            columns: ['keeper_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'game_sessions_scenario_id_scenarios_scenario_id_fk';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
            referencedColumns: ['scenario_id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          is_read: boolean;
          link_url: string | null;
          message: string;
          notification_id: string;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          is_read?: boolean;
          link_url?: string | null;
          message: string;
          notification_id: string;
          title: string;
          type: Database['public']['Enums']['notification_type'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          is_read?: boolean;
          link_url?: string | null;
          message?: string;
          notification_id?: string;
          title?: string;
          type?: Database['public']['Enums']['notification_type'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      scenario_systems: {
        Row: {
          created_at: string;
          name: string;
          system_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          name: string;
          system_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          name?: string;
          system_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scenario_tags: {
        Row: {
          scenario_id: string;
          tag_id: string;
        };
        Insert: {
          scenario_id: string;
          tag_id: string;
        };
        Update: {
          scenario_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scenario_tags_scenario_id_scenarios_scenario_id_fk';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
            referencedColumns: ['scenario_id'];
          },
          {
            foreignKeyName: 'scenario_tags_tag_id_tags_tag_id_fk';
            columns: ['tag_id'];
            isOneToOne: false;
            referencedRelation: 'tags';
            referencedColumns: ['tag_id'];
          },
        ];
      };
      scenarios: {
        Row: {
          author: string | null;
          created_at: string;
          created_by_id: string | null;
          description: string | null;
          distribute_url: string | null;
          handout_type: Database['public']['Enums']['handout_type'];
          max_player: number | null;
          max_playtime: number | null;
          min_player: number | null;
          min_playtime: number | null;
          name: string;
          scenario_id: string;
          scenario_image_url: string | null;
          scenario_system_id: string;
          source_fetched_at: string | null;
          source_type:
            | Database['public']['Enums']['scenario_source_type']
            | null;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          author?: string | null;
          created_at?: string;
          created_by_id?: string | null;
          description?: string | null;
          distribute_url?: string | null;
          handout_type?: Database['public']['Enums']['handout_type'];
          max_player?: number | null;
          max_playtime?: number | null;
          min_player?: number | null;
          min_playtime?: number | null;
          name: string;
          scenario_id: string;
          scenario_image_url?: string | null;
          scenario_system_id: string;
          source_fetched_at?: string | null;
          source_type?:
            | Database['public']['Enums']['scenario_source_type']
            | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          author?: string | null;
          created_at?: string;
          created_by_id?: string | null;
          description?: string | null;
          distribute_url?: string | null;
          handout_type?: Database['public']['Enums']['handout_type'];
          max_player?: number | null;
          max_playtime?: number | null;
          min_player?: number | null;
          min_playtime?: number | null;
          name?: string;
          scenario_id?: string;
          scenario_image_url?: string | null;
          scenario_system_id?: string;
          source_fetched_at?: string | null;
          source_type?:
            | Database['public']['Enums']['scenario_source_type']
            | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scenarios_created_by_id_users_user_id_fk';
            columns: ['created_by_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'scenarios_scenario_system_id_scenario_systems_system_id_fk';
            columns: ['scenario_system_id'];
            isOneToOne: false;
            referencedRelation: 'scenario_systems';
            referencedColumns: ['system_id'];
          },
        ];
      };
      schedule_responses: {
        Row: {
          availability: Database['public']['Enums']['schedule_availability'];
          comment: string | null;
          created_at: string;
          response_id: string;
          schedule_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          availability?: Database['public']['Enums']['schedule_availability'];
          comment?: string | null;
          created_at?: string;
          response_id: string;
          schedule_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          availability?: Database['public']['Enums']['schedule_availability'];
          comment?: string | null;
          created_at?: string;
          response_id?: string;
          schedule_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedule_responses_schedule_id_game_schedules_session_id_fk';
            columns: ['schedule_id'];
            isOneToOne: false;
            referencedRelation: 'game_schedules';
            referencedColumns: ['session_id'];
          },
          {
            foreignKeyName: 'schedule_responses_user_id_users_user_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      session_links: {
        Row: {
          created_at: string;
          label: string | null;
          link_id: string;
          link_type: Database['public']['Enums']['session_link_type'];
          session_id: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          label?: string | null;
          link_id: string;
          link_type?: Database['public']['Enums']['session_link_type'];
          session_id: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          label?: string | null;
          link_id?: string;
          link_type?: Database['public']['Enums']['session_link_type'];
          session_id?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_links_session_id_game_sessions_game_session_id_fk';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
        ];
      };
      session_participants: {
        Row: {
          application_message: string | null;
          applied_at: string | null;
          approved_at: string | null;
          character_sheet_url: string | null;
          created_at: string;
          participant_status: Database['public']['Enums']['participant_status'];
          participant_type: Database['public']['Enums']['participant_type'];
          session_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          application_message?: string | null;
          applied_at?: string | null;
          approved_at?: string | null;
          character_sheet_url?: string | null;
          created_at?: string;
          participant_status?: Database['public']['Enums']['participant_status'];
          participant_type?: Database['public']['Enums']['participant_type'];
          session_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          application_message?: string | null;
          applied_at?: string | null;
          approved_at?: string | null;
          character_sheet_url?: string | null;
          created_at?: string;
          participant_status?: Database['public']['Enums']['participant_status'];
          participant_type?: Database['public']['Enums']['participant_type'];
          session_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_participants_session_id_game_sessions_game_session_id_f';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
          {
            foreignKeyName: 'session_participants_user_id_users_user_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          name: string;
          tag_id: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          name: string;
          tag_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          name?: string;
          tag_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_reviews: {
        Row: {
          created_at: string;
          open_comment: string | null;
          rating: number | null;
          scenario_id: string;
          session_id: string | null;
          spoiler_comment: string | null;
          updated_at: string;
          user_id: string;
          user_review_id: string;
        };
        Insert: {
          created_at?: string;
          open_comment?: string | null;
          rating?: number | null;
          scenario_id: string;
          session_id?: string | null;
          spoiler_comment?: string | null;
          updated_at?: string;
          user_id: string;
          user_review_id: string;
        };
        Update: {
          created_at?: string;
          open_comment?: string | null;
          rating?: number | null;
          scenario_id?: string;
          session_id?: string | null;
          spoiler_comment?: string | null;
          updated_at?: string;
          user_id?: string;
          user_review_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_reviews_scenario_id_scenarios_scenario_id_fk';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
            referencedColumns: ['scenario_id'];
          },
          {
            foreignKeyName: 'user_reviews_session_id_game_sessions_game_session_id_fk';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
          {
            foreignKeyName: 'user_reviews_user_id_users_user_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      user_scenario_preferences: {
        Row: {
          can_keeper: boolean;
          created_at: string;
          had_scenario: boolean;
          is_like: boolean;
          is_played: boolean;
          is_watched: boolean;
          scenario_id: string;
          session_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          can_keeper: boolean;
          created_at?: string;
          had_scenario: boolean;
          is_like: boolean;
          is_played: boolean;
          is_watched: boolean;
          scenario_id: string;
          session_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          can_keeper?: boolean;
          created_at?: string;
          had_scenario?: boolean;
          is_like?: boolean;
          is_played?: boolean;
          is_watched?: boolean;
          scenario_id?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_scenario_preferences_scenario_id_scenarios_scenario_id_fk';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
            referencedColumns: ['scenario_id'];
          },
          {
            foreignKeyName: 'user_scenario_preferences_session_id_game_sessions_game_session';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
          {
            foreignKeyName: 'user_scenario_preferences_user_id_users_user_id_fk';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
        ];
      };
      users: {
        Row: {
          bio: string | null;
          created_at: string;
          discord_id: string;
          favorite_scenarios: string | null;
          image: string | null;
          lastlogin_at: string | null;
          nickname: string;
          role: Database['public']['Enums']['role'];
          updated_at: string;
          user_id: string;
          user_name: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          discord_id: string;
          favorite_scenarios?: string | null;
          image?: string | null;
          lastlogin_at?: string | null;
          nickname: string;
          role?: Database['public']['Enums']['role'];
          updated_at?: string;
          user_id: string;
          user_name: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          discord_id?: string;
          favorite_scenarios?: string | null;
          image?: string | null;
          lastlogin_at?: string | null;
          nickname?: string;
          role?: Database['public']['Enums']['role'];
          updated_at?: string;
          user_id?: string;
          user_name?: string;
        };
        Relationships: [];
      };
      video_links: {
        Row: {
          created_at: string;
          created_by_id: string;
          scenario_id: string;
          session_id: string;
          spoiler: boolean;
          updated_at: string;
          video_link_id: string;
          video_url: string;
        };
        Insert: {
          created_at?: string;
          created_by_id: string;
          scenario_id: string;
          session_id: string;
          spoiler?: boolean;
          updated_at?: string;
          video_link_id: string;
          video_url: string;
        };
        Update: {
          created_at?: string;
          created_by_id?: string;
          scenario_id?: string;
          session_id?: string;
          spoiler?: boolean;
          updated_at?: string;
          video_link_id?: string;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_links_created_by_id_users_user_id_fk';
            columns: ['created_by_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'video_links_scenario_id_scenarios_scenario_id_fk';
            columns: ['scenario_id'];
            isOneToOne: false;
            referencedRelation: 'scenarios';
            referencedColumns: ['scenario_id'];
          },
          {
            foreignKeyName: 'video_links_session_id_game_sessions_game_session_id_fk';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'game_sessions';
            referencedColumns: ['game_session_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      feedback_category: 'BUG' | 'FEATURE' | 'UI_UX' | 'OTHER';
      feedback_priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      feedback_status:
        | 'NEW'
        | 'TRIAGED'
        | 'PLANNED'
        | 'IN_PROGRESS'
        | 'DONE'
        | 'WONT_FIX'
        | 'DUPLICATE';
      handout_type: 'NONE' | 'PUBLIC' | 'SECRET';
      notification_type:
        | 'FEEDBACK_STATUS_CHANGED'
        | 'FEEDBACK_COMMENT'
        | 'FEEDBACK_MERGED';
      participant_status: 'PENDING' | 'CONFIRMED';
      participant_type: 'KEEPER' | 'PLAYER' | 'SPECTATOR';
      role: 'MODERATOR' | 'MEMBER';
      scenario_source_type: 'manual' | 'booth' | 'talto';
      schedule_availability: 'OK' | 'MAYBE' | 'NG';
      schedule_phase: 'ADJUSTING' | 'CONFIRMED';
      session_link_type: 'DISCORD' | 'CCFOLIA' | 'OTHER';
      session_phase:
        | 'RECRUITING'
        | 'PREPARATION'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED';
      session_visibility: 'PUBLIC' | 'FOLLOWERS_ONLY';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      feedback_category: ['BUG', 'FEATURE', 'UI_UX', 'OTHER'],
      feedback_priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      feedback_status: [
        'NEW',
        'TRIAGED',
        'PLANNED',
        'IN_PROGRESS',
        'DONE',
        'WONT_FIX',
        'DUPLICATE',
      ],
      handout_type: ['NONE', 'PUBLIC', 'SECRET'],
      notification_type: [
        'FEEDBACK_STATUS_CHANGED',
        'FEEDBACK_COMMENT',
        'FEEDBACK_MERGED',
      ],
      participant_status: ['PENDING', 'CONFIRMED'],
      participant_type: ['KEEPER', 'PLAYER', 'SPECTATOR'],
      role: ['MODERATOR', 'MEMBER'],
      scenario_source_type: ['manual', 'booth', 'talto'],
      schedule_availability: ['OK', 'MAYBE', 'NG'],
      schedule_phase: ['ADJUSTING', 'CONFIRMED'],
      session_link_type: ['DISCORD', 'CCFOLIA', 'OTHER'],
      session_phase: [
        'RECRUITING',
        'PREPARATION',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ],
      session_visibility: ['PUBLIC', 'FOLLOWERS_ONLY'],
    },
  },
} as const;
