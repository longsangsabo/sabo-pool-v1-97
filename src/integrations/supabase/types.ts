export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_type: string
          created_at: string | null
          description: string
          difficulty: string | null
          icon_url: string | null
          id: string
          is_hidden: boolean | null
          name: string
          points_reward: number | null
          requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          achievement_type: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          icon_url?: string | null
          id?: string
          is_hidden?: boolean | null
          name: string
          points_reward?: number | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          achievement_type?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          icon_url?: string | null
          id?: string
          is_hidden?: boolean | null
          name?: string
          points_reward?: number | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      approval_logs: {
        Row: {
          action: string
          approver_id: string
          comments: string | null
          created_at: string | null
          id: string
          registration_id: string
        }
        Insert: {
          action: string
          approver_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          registration_id: string
        }
        Update: {
          action?: string
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_logs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "club_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          bet_points: number | null
          challenger_id: string
          club_id: string | null
          created_at: string
          expires_at: string | null
          handicap_05_rank: number | null
          handicap_1_rank: number | null
          id: string
          is_open_challenge: boolean | null
          location: string | null
          message: string | null
          opponent_id: string | null
          race_to: number | null
          responded_at: string | null
          response_message: string | null
          scheduled_time: string | null
          stake_amount: number | null
          stake_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          bet_points?: number | null
          challenger_id: string
          club_id?: string | null
          created_at?: string
          expires_at?: string | null
          handicap_05_rank?: number | null
          handicap_1_rank?: number | null
          id?: string
          is_open_challenge?: boolean | null
          location?: string | null
          message?: string | null
          opponent_id?: string | null
          race_to?: number | null
          responded_at?: string | null
          response_message?: string | null
          scheduled_time?: string | null
          stake_amount?: number | null
          stake_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          bet_points?: number | null
          challenger_id?: string
          club_id?: string | null
          created_at?: string
          expires_at?: string | null
          handicap_05_rank?: number | null
          handicap_1_rank?: number | null
          id?: string
          is_open_challenge?: boolean | null
          location?: string | null
          message?: string | null
          opponent_id?: string | null
          race_to?: number | null
          responded_at?: string | null
          response_message?: string | null
          scheduled_time?: string | null
          stake_amount?: number | null
          stake_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_challenges_challenger"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_challenges_opponent"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      club_accountability: {
        Row: {
          accuracy_percentage: number | null
          club_id: string
          created_at: string
          false_verification_reports: number | null
          id: string
          last_calculated_at: string | null
          restriction_end_date: string | null
          restriction_start_date: string | null
          restriction_status: string | null
          total_verifications: number | null
          updated_at: string
          warning_count: number | null
        }
        Insert: {
          accuracy_percentage?: number | null
          club_id: string
          created_at?: string
          false_verification_reports?: number | null
          id?: string
          last_calculated_at?: string | null
          restriction_end_date?: string | null
          restriction_start_date?: string | null
          restriction_status?: string | null
          total_verifications?: number | null
          updated_at?: string
          warning_count?: number | null
        }
        Update: {
          accuracy_percentage?: number | null
          club_id?: string
          created_at?: string
          false_verification_reports?: number | null
          id?: string
          last_calculated_at?: string | null
          restriction_end_date?: string | null
          restriction_start_date?: string | null
          restriction_status?: string | null
          total_verifications?: number | null
          updated_at?: string
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "club_accountability_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_profiles: {
        Row: {
          address: string
          club_name: string
          created_at: string
          id: string
          number_of_tables: number | null
          operating_hours: Json | null
          phone: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address: string
          club_name: string
          created_at?: string
          id?: string
          number_of_tables?: number | null
          operating_hours?: Json | null
          phone: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string
          club_name?: string
          created_at?: string
          id?: string
          number_of_tables?: number | null
          operating_hours?: Json | null
          phone?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_club_profiles_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      club_registrations: {
        Row: {
          address: string
          amenities: Json | null
          approved_at: string | null
          approved_by: string | null
          basic_price: number
          business_license_url: string | null
          city: string
          closing_time: string
          club_name: string
          created_at: string | null
          district: string
          email: string | null
          facebook_url: string | null
          google_maps_url: string | null
          id: string
          manager_name: string | null
          manager_phone: string | null
          normal_hour_price: number | null
          opening_time: string
          peak_hour_price: number | null
          phone: string
          photos: string[] | null
          rejection_reason: string | null
          status: string | null
          table_count: number
          table_types: string[]
          updated_at: string | null
          user_id: string | null
          vip_table_price: number | null
          weekend_price: number | null
        }
        Insert: {
          address: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          basic_price: number
          business_license_url?: string | null
          city: string
          closing_time: string
          club_name: string
          created_at?: string | null
          district: string
          email?: string | null
          facebook_url?: string | null
          google_maps_url?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          normal_hour_price?: number | null
          opening_time: string
          peak_hour_price?: number | null
          phone: string
          photos?: string[] | null
          rejection_reason?: string | null
          status?: string | null
          table_count: number
          table_types: string[]
          updated_at?: string | null
          user_id?: string | null
          vip_table_price?: number | null
          weekend_price?: number | null
        }
        Update: {
          address?: string
          amenities?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          basic_price?: number
          business_license_url?: string | null
          city?: string
          closing_time?: string
          club_name?: string
          created_at?: string | null
          district?: string
          email?: string | null
          facebook_url?: string | null
          google_maps_url?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          normal_hour_price?: number | null
          opening_time?: string
          peak_hour_price?: number | null
          phone?: string
          photos?: string[] | null
          rejection_reason?: string | null
          status?: string | null
          table_count?: number
          table_types?: string[]
          updated_at?: string | null
          user_id?: string | null
          vip_table_price?: number | null
          weekend_price?: number | null
        }
        Relationships: []
      }
      club_stats: {
        Row: {
          active_members: number | null
          avg_trust_score: number | null
          club_id: string
          created_at: string | null
          id: string
          month: number
          peak_hours: Json | null
          total_matches_hosted: number | null
          total_revenue: number | null
          updated_at: string | null
          verified_members: number | null
          year: number
        }
        Insert: {
          active_members?: number | null
          avg_trust_score?: number | null
          club_id: string
          created_at?: string | null
          id?: string
          month: number
          peak_hours?: Json | null
          total_matches_hosted?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          verified_members?: number | null
          year: number
        }
        Update: {
          active_members?: number | null
          avg_trust_score?: number | null
          club_id?: string
          created_at?: string | null
          id?: string
          month?: number
          peak_hours?: Json | null
          total_matches_hosted?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          verified_members?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_stats_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          status: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      cue_maintenance: {
        Row: {
          cost: number | null
          created_at: string | null
          cue_id: string | null
          id: string
          maintenance_date: string
          maintenance_type: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          cue_id?: string | null
          id?: string
          maintenance_date: string
          maintenance_type: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          cue_id?: string | null
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cue_maintenance_cue_id_fkey"
            columns: ["cue_id"]
            isOneToOne: false
            referencedRelation: "player_cues"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenge_stats: {
        Row: {
          challenge_count: number | null
          challenge_date: string
          created_at: string | null
          id: string
          player_id: string
          updated_at: string | null
        }
        Insert: {
          challenge_count?: number | null
          challenge_date: string
          created_at?: string | null
          id?: string
          player_id: string
          updated_at?: string | null
        }
        Update: {
          challenge_count?: number | null
          challenge_date?: string
          created_at?: string | null
          id?: string
          player_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_user_pool: {
        Row: {
          created_at: string | null
          currently_used_in: string | null
          id: string
          is_available: boolean | null
          last_used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currently_used_in?: string | null
          id?: string
          is_available?: boolean | null
          last_used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currently_used_in?: string | null
          id?: string
          is_available?: boolean | null
          last_used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_user_pool_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elo_history: {
        Row: {
          created_at: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id: string
          k_factor: number
          match_result: string
          match_result_id: string | null
          opponent_elo: number | null
          opponent_id: string | null
          player_id: string | null
          rank_after: string | null
          rank_before: string | null
        }
        Insert: {
          created_at?: string | null
          elo_after: number
          elo_before: number
          elo_change: number
          id?: string
          k_factor?: number
          match_result: string
          match_result_id?: string | null
          opponent_elo?: number | null
          opponent_id?: string | null
          player_id?: string | null
          rank_after?: string | null
          rank_before?: string | null
        }
        Update: {
          created_at?: string | null
          elo_after?: number
          elo_before?: number
          elo_change?: number
          id?: string
          k_factor?: number
          match_result?: string
          match_result_id?: string | null
          opponent_elo?: number | null
          opponent_id?: string | null
          player_id?: string | null
          rank_after?: string | null
          rank_before?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elo_history_match_result_id_fkey"
            columns: ["match_result_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          payment_status: string | null
          registration_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          registration_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image: string | null
          club_id: string | null
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          description: string | null
          end_date: string
          entry_fee: number | null
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          name: string
          registration_deadline: string | null
          registration_required: boolean | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          banner_image?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date: string
          entry_fee?: number | null
          event_type: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name: string
          registration_deadline?: string | null
          registration_required?: boolean | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_image?: string | null
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string
          entry_fee?: number | null
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name?: string
          registration_deadline?: string | null
          registration_required?: boolean | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favorite_opponents: {
        Row: {
          created_at: string | null
          id: string
          last_played: string | null
          losses: number | null
          matches_count: number | null
          opponent_id: string
          player_id: string
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_played?: string | null
          losses?: number | null
          matches_count?: number | null
          opponent_id: string
          player_id: string
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_played?: string | null
          losses?: number | null
          matches_count?: number | null
          opponent_id?: string
          player_id?: string
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          post_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          post_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          post_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string | null
          id: string
          matches: number | null
          player_id: string
          rank_id: string | null
          spa_points: number | null
          week_start: string
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matches?: number | null
          player_id: string
          rank_id?: string | null
          spa_points?: number | null
          week_start: string
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matches?: number | null
          player_id?: string
          rank_id?: string | null
          spa_points?: number | null
          week_start?: string
          wins?: number | null
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          city: string | null
          created_at: string | null
          district: string | null
          id: string
          month: number
          player_id: string
          position: number | null
          rank_category: string | null
          ranking_points: number | null
          total_matches: number | null
          total_wins: number | null
          updated_at: string | null
          win_rate: number | null
          year: number
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          month: number
          player_id: string
          position?: number | null
          rank_category?: string | null
          ranking_points?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string | null
          win_rate?: number | null
          year: number
        }
        Update: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          month?: number
          player_id?: string
          position?: number | null
          rank_category?: string | null
          ranking_points?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string | null
          win_rate?: number | null
          year?: number
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          club_id: string | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_featured: boolean | null
          match_id: string | null
          metadata: Json | null
          started_at: string | null
          status: string | null
          stream_key: string
          stream_url: string | null
          streamer_id: string
          title: string
          tournament_id: string | null
          updated_at: string | null
          viewer_count: number | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_featured?: boolean | null
          match_id?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          stream_key: string
          stream_url?: string | null
          streamer_id: string
          title: string
          tournament_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_featured?: boolean | null
          match_id?: string | null
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          stream_key?: string
          stream_url?: string | null
          streamer_id?: string
          title?: string
          tournament_id?: string | null
          updated_at?: string | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_streams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_streams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      match_disputes: {
        Row: {
          admin_response: string | null
          created_at: string | null
          dispute_details: string | null
          dispute_reason: string
          disputed_by: string | null
          evidence_urls: string[] | null
          id: string
          match_result_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          dispute_details?: string | null
          dispute_reason: string
          disputed_by?: string | null
          evidence_urls?: string[] | null
          id?: string
          match_result_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          dispute_details?: string | null
          dispute_reason?: string
          disputed_by?: string | null
          evidence_urls?: string[] | null
          id?: string
          match_result_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_disputes_match_result_id_fkey"
            columns: ["match_result_id"]
            isOneToOne: false
            referencedRelation: "match_results"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_time: string | null
          event_type: string
          id: string
          match_id: string | null
          reported_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_time?: string | null
          event_type: string
          id?: string
          match_id?: string | null
          reported_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_time?: string | null
          event_type?: string
          id?: string
          match_id?: string | null
          reported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "tournament_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_history: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string | null
          id: string
          match_id: string | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          match_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          match_id: string
          rated_player_id: string
          rater_id: string
          skill_assessment: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id: string
          rated_player_id: string
          rater_id: string
          skill_assessment: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          match_id?: string
          rated_player_id?: string
          rater_id?: string
          skill_assessment?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          club_id: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          id: string
          loser_id: string | null
          match_date: string
          match_format: string
          match_id: string | null
          match_notes: string | null
          player1_confirmed: boolean | null
          player1_confirmed_at: string | null
          player1_elo_after: number
          player1_elo_before: number
          player1_elo_change: number
          player1_id: string | null
          player1_score: number
          player1_stats: Json | null
          player2_confirmed: boolean | null
          player2_confirmed_at: string | null
          player2_elo_after: number
          player2_elo_before: number
          player2_elo_change: number
          player2_id: string | null
          player2_score: number
          player2_stats: Json | null
          referee_id: string | null
          result_status: string
          total_frames: number
          tournament_id: string | null
          updated_at: string | null
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
          winner_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          loser_id?: string | null
          match_date?: string
          match_format?: string
          match_id?: string | null
          match_notes?: string | null
          player1_confirmed?: boolean | null
          player1_confirmed_at?: string | null
          player1_elo_after?: number
          player1_elo_before?: number
          player1_elo_change?: number
          player1_id?: string | null
          player1_score?: number
          player1_stats?: Json | null
          player2_confirmed?: boolean | null
          player2_confirmed_at?: string | null
          player2_elo_after?: number
          player2_elo_before?: number
          player2_elo_change?: number
          player2_id?: string | null
          player2_score?: number
          player2_stats?: Json | null
          referee_id?: string | null
          result_status?: string
          total_frames?: number
          tournament_id?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
          winner_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          loser_id?: string | null
          match_date?: string
          match_format?: string
          match_id?: string | null
          match_notes?: string | null
          player1_confirmed?: boolean | null
          player1_confirmed_at?: string | null
          player1_elo_after?: number
          player1_elo_before?: number
          player1_elo_change?: number
          player1_id?: string | null
          player1_score?: number
          player1_stats?: Json | null
          player2_confirmed?: boolean | null
          player2_confirmed_at?: string | null
          player2_elo_after?: number
          player2_elo_before?: number
          player2_elo_change?: number
          player2_id?: string | null
          player2_score?: number
          player2_stats?: Json | null
          referee_id?: string | null
          result_status?: string
          total_frames?: number
          tournament_id?: string | null
          updated_at?: string | null
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          challenge_id: string | null
          club_id: string | null
          created_at: string
          id: string
          played_at: string | null
          player1_id: string
          player2_id: string
          privacy_level: string | null
          score_player1: number | null
          score_player2: number | null
          status: string | null
          tournament_id: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          played_at?: string | null
          player1_id: string
          player2_id: string
          privacy_level?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          played_at?: string | null
          player1_id?: string
          player2_id?: string
          privacy_level?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_matches_challenge"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_matches_player1"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_matches_player2"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          benefits: Json | null
          club_id: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          max_subscribers: number | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          max_subscribers?: number | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_subscribers?: number | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          club_id: string
          created_at: string
          id: string
          joined_at: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          joined_at?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_snapshots: {
        Row: {
          created_at: string | null
          id: string
          month: string
          player_id: string
          rank_id: string | null
          spa_points: number | null
          total_matches: number | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          player_id: string
          rank_id?: string | null
          spa_points?: number | null
          total_matches?: number | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          player_id?: string
          rank_id?: string | null
          spa_points?: number | null
          total_matches?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          action_url: string | null
          category: string
          channels_failed: Json | null
          channels_sent: Json | null
          created_at: string | null
          delivered_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category: string
          channels_failed?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          channels_failed?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          challenge_level: string | null
          created_at: string | null
          email: boolean | null
          id: string
          in_app: boolean | null
          match_level: string | null
          push_notification: boolean | null
          quiet_end_time: string | null
          quiet_hours_enabled: boolean | null
          quiet_start_time: string | null
          ranking_level: string | null
          sms: boolean | null
          social_level: string | null
          timezone: string | null
          tournament_level: string | null
          updated_at: string | null
          user_id: string
          zalo: boolean | null
        }
        Insert: {
          challenge_level?: string | null
          created_at?: string | null
          email?: boolean | null
          id?: string
          in_app?: boolean | null
          match_level?: string | null
          push_notification?: boolean | null
          quiet_end_time?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_start_time?: string | null
          ranking_level?: string | null
          sms?: boolean | null
          social_level?: string | null
          timezone?: string | null
          tournament_level?: string | null
          updated_at?: string | null
          user_id: string
          zalo?: boolean | null
        }
        Update: {
          challenge_level?: string | null
          created_at?: string | null
          email?: boolean | null
          id?: string
          in_app?: boolean | null
          match_level?: string | null
          push_notification?: boolean | null
          quiet_end_time?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_start_time?: string | null
          ranking_level?: string | null
          sms?: boolean | null
          social_level?: string | null
          timezone?: string | null
          tournament_level?: string | null
          updated_at?: string | null
          user_id?: string
          zalo?: boolean | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          category: string
          created_at: string | null
          default_priority: string | null
          email_template: string | null
          id: string
          is_active: boolean | null
          locale: string | null
          message_template: string
          sms_template: string | null
          supported_channels: Json | null
          template_key: string
          title_template: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_priority?: string | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          message_template: string
          sms_template?: string | null
          supported_channels?: Json | null
          template_key: string
          title_template: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_priority?: string | null
          email_template?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          message_template?: string
          sms_template?: string | null
          supported_channels?: Json | null
          template_key?: string
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_notifications_sender"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_notifications_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications_partitioned: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications_y2023m12: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications_y2024m01: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications_y2024m02: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications_y2024m03: {
        Row: {
          action_url: string | null
          created_at: string | null
          deleted_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          sender_id: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          seller_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string | null
          contact_info: Json
          created_at: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json
          status: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          contact_info: Json
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address: Json
          status?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          contact_info?: Json
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          status?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      player_achievements: {
        Row: {
          achievement_id: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          player_id: string | null
          progress: number | null
        }
        Insert: {
          achievement_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
          progress?: number | null
        }
        Update: {
          achievement_id?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_availability: {
        Row: {
          available_until: string | null
          created_at: string | null
          id: string
          location: string | null
          max_distance_km: number | null
          preferred_time: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_until?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          max_distance_km?: number | null
          preferred_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_until?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          max_distance_km?: number | null
          preferred_time?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      player_cues: {
        Row: {
          brand: string | null
          condition: string | null
          created_at: string | null
          cue_type: string | null
          current_value: number | null
          id: string
          image_url: string | null
          is_favorite: boolean | null
          joint_type: string | null
          length_inches: number | null
          model: string | null
          name: string
          notes: string | null
          player_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          shaft_material: string | null
          tip_size_mm: number | null
          updated_at: string | null
          weight_oz: number | null
          wrap_type: string | null
        }
        Insert: {
          brand?: string | null
          condition?: string | null
          created_at?: string | null
          cue_type?: string | null
          current_value?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          joint_type?: string | null
          length_inches?: number | null
          model?: string | null
          name: string
          notes?: string | null
          player_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shaft_material?: string | null
          tip_size_mm?: number | null
          updated_at?: string | null
          weight_oz?: number | null
          wrap_type?: string | null
        }
        Update: {
          brand?: string | null
          condition?: string | null
          created_at?: string | null
          cue_type?: string | null
          current_value?: number | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean | null
          joint_type?: string | null
          length_inches?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          player_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          shaft_material?: string | null
          tip_size_mm?: number | null
          updated_at?: string | null
          weight_oz?: number | null
          wrap_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_cues_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      player_milestones: {
        Row: {
          achieved_at: string | null
          claimed: boolean | null
          created_at: string | null
          id: string
          milestone_id: string
          player_id: string
          progress: number | null
        }
        Insert: {
          achieved_at?: string | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          milestone_id: string
          player_id: string
          progress?: number | null
        }
        Update: {
          achieved_at?: string | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          milestone_id?: string
          player_id?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "spa_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rankings: {
        Row: {
          average_opponent_strength: number | null
          club_verified: boolean | null
          created_at: string | null
          current_rank_id: string | null
          daily_challenges: number | null
          elo_points: number | null
          id: string
          performance_quality: number | null
          player_id: string | null
          rank_points: number | null
          season_start: string | null
          spa_points: number | null
          total_matches: number | null
          tournament_wins: number | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          wins: number | null
        }
        Insert: {
          average_opponent_strength?: number | null
          club_verified?: boolean | null
          created_at?: string | null
          current_rank_id?: string | null
          daily_challenges?: number | null
          elo_points?: number | null
          id?: string
          performance_quality?: number | null
          player_id?: string | null
          rank_points?: number | null
          season_start?: string | null
          spa_points?: number | null
          total_matches?: number | null
          tournament_wins?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          wins?: number | null
        }
        Update: {
          average_opponent_strength?: number | null
          club_verified?: boolean | null
          created_at?: string | null
          current_rank_id?: string | null
          daily_challenges?: number | null
          elo_points?: number | null
          id?: string
          performance_quality?: number | null
          player_id?: string | null
          rank_points?: number | null
          season_start?: string | null
          spa_points?: number | null
          total_matches?: number | null
          tournament_wins?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_player_rankings_player"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "player_rankings_current_rank_id_fkey"
            columns: ["current_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rankings_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_match_date: string | null
          longest_streak: number | null
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          player_id: string
          total_points_lost: number | null
          total_points_won: number | null
          updated_at: string | null
          win_rate: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_match_date?: string | null
          longest_streak?: number | null
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          player_id: string
          total_points_lost?: number | null
          total_points_won?: number | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_match_date?: string | null
          longest_streak?: number | null
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          player_id?: string
          total_points_lost?: number | null
          total_points_won?: number | null
          updated_at?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      player_trust_scores: {
        Row: {
          created_at: string
          flag_status: string | null
          id: string
          last_calculated_at: string | null
          negative_reports_count: number | null
          player_id: string
          positive_ratings: number | null
          total_ratings: number | null
          trust_percentage: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_status?: string | null
          id?: string
          last_calculated_at?: string | null
          negative_reports_count?: number | null
          player_id: string
          positive_ratings?: number | null
          total_ratings?: number | null
          trust_percentage?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_status?: string | null
          id?: string
          last_calculated_at?: string | null
          negative_reports_count?: number | null
          player_id?: string
          positive_ratings?: number | null
          total_ratings?: number | null
          trust_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pool_tables: {
        Row: {
          club_id: string | null
          condition: string | null
          created_at: string | null
          hourly_rate: number
          id: string
          is_available: boolean | null
          last_maintenance_date: string | null
          location_in_club: string | null
          notes: string | null
          peak_hour_rate: number | null
          table_number: number
          table_size: string | null
          table_type: string
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          condition?: string | null
          created_at?: string | null
          hourly_rate: number
          id?: string
          is_available?: boolean | null
          last_maintenance_date?: string | null
          location_in_club?: string | null
          notes?: string | null
          peak_hour_rate?: number | null
          table_number: number
          table_size?: string | null
          table_type: string
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          condition?: string | null
          created_at?: string | null
          hourly_rate?: number
          id?: string
          is_available?: boolean | null
          last_maintenance_date?: string | null
          location_in_club?: string | null
          notes?: string | null
          peak_hour_rate?: number | null
          table_number?: number
          table_size?: string | null
          table_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_tables_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comments_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag_id?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          metadata: Json | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          metadata?: Json | null
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          player1_id: string
          player2_id: string
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          player1_id: string
          player2_id: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          player1_id?: string
          player2_id?: string
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          helpful_votes: number | null
          id: string
          product_id: string | null
          rating: number
          reviewer_id: string | null
          title: string | null
          updated_at: string | null
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          product_id?: string | null
          rating: number
          reviewer_id?: string | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          product_id?: string | null
          rating?: number
          reviewer_id?: string | null
          title?: string | null
          updated_at?: string | null
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          name: string
          price: number
          seller_id: string | null
          specifications: Json | null
          status: string | null
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          name: string
          price: number
          seller_id?: string | null
          specifications?: Json | null
          status?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          name?: string
          price?: number
          seller_id?: string | null
          specifications?: Json | null
          status?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_role: string | null
          activity_status: string | null
          avatar_url: string | null
          ban_expires_at: string | null
          ban_reason: string | null
          ban_status: string | null
          bio: string | null
          city: string | null
          club_id: string | null
          created_at: string
          display_name: string | null
          district: string | null
          elo: number | null
          email: string | null
          email_verified: boolean | null
          experience_years: number | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          is_demo_user: boolean | null
          last_activity_check: string | null
          member_since: string | null
          my_referral_code: string | null
          nickname: string | null
          phone: string | null
          rank_verified_at: string | null
          rank_verified_by: string | null
          referral_bonus_claimed: boolean | null
          referred_by_code: string | null
          role: string | null
          skill_level: string | null
          updated_at: string
          user_id: string
          verified_rank: string | null
        }
        Insert: {
          active_role?: string | null
          activity_status?: string | null
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          ban_status?: string | null
          bio?: string | null
          city?: string | null
          club_id?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          elo?: number | null
          email?: string | null
          email_verified?: boolean | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_demo_user?: boolean | null
          last_activity_check?: string | null
          member_since?: string | null
          my_referral_code?: string | null
          nickname?: string | null
          phone?: string | null
          rank_verified_at?: string | null
          rank_verified_by?: string | null
          referral_bonus_claimed?: boolean | null
          referred_by_code?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id: string
          verified_rank?: string | null
        }
        Update: {
          active_role?: string | null
          activity_status?: string | null
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          ban_status?: string | null
          bio?: string | null
          city?: string | null
          club_id?: string | null
          created_at?: string
          display_name?: string | null
          district?: string | null
          elo?: number | null
          email?: string | null
          email_verified?: boolean | null
          experience_years?: number | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_demo_user?: boolean | null
          last_activity_check?: string | null
          member_since?: string | null
          my_referral_code?: string | null
          nickname?: string | null
          phone?: string | null
          rank_verified_at?: string | null
          rank_verified_by?: string | null
          referral_bonus_claimed?: boolean | null
          referred_by_code?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string
          user_id?: string
          verified_rank?: string | null
        }
        Relationships: []
      }
      rank_adjustments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          club_id: string
          club_notes: string | null
          created_at: string
          current_rank: string
          id: string
          match_history: string | null
          player_id: string
          reason: string
          rejection_reason: string | null
          requested_rank: string
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          club_id: string
          club_notes?: string | null
          created_at?: string
          current_rank: string
          id?: string
          match_history?: string | null
          player_id: string
          reason: string
          rejection_reason?: string | null
          requested_rank: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          club_id?: string
          club_notes?: string | null
          created_at?: string
          current_rank?: string
          id?: string
          match_history?: string | null
          player_id?: string
          reason?: string
          rejection_reason?: string | null
          requested_rank?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_adjustments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_reports: {
        Row: {
          actual_skill_assessment: string | null
          admin_notes: string | null
          created_at: string
          description: string | null
          evidence_photos: string[] | null
          id: string
          match_id: string | null
          report_type: string | null
          reported_player_id: string
          reported_rank: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actual_skill_assessment?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          match_id?: string | null
          report_type?: string | null
          reported_player_id: string
          reported_rank?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actual_skill_assessment?: string | null
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          evidence_photos?: string[] | null
          id?: string
          match_id?: string | null
          report_type?: string | null
          reported_player_id?: string
          reported_rank?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_verifications: {
        Row: {
          club_id: string
          club_notes: string | null
          created_at: string
          current_rank: string | null
          id: string
          player_id: string
          proof_photos: string[] | null
          rejection_reason: string | null
          requested_rank: string
          status: string | null
          test_result: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          club_id: string
          club_notes?: string | null
          created_at?: string
          current_rank?: string | null
          id?: string
          player_id: string
          proof_photos?: string[] | null
          rejection_reason?: string | null
          requested_rank: string
          status?: string | null
          test_result?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          club_notes?: string | null
          created_at?: string
          current_rank?: string | null
          id?: string
          player_id?: string
          proof_photos?: string[] | null
          rejection_reason?: string | null
          requested_rank?: string
          status?: string | null
          test_result?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_verifications_club"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rank_verifications_player"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ranking_history: {
        Row: {
          id: string
          new_rank_id: string | null
          old_rank_id: string | null
          player_id: string | null
          promotion_date: string | null
          season: number | null
          total_points_earned: number | null
        }
        Insert: {
          id?: string
          new_rank_id?: string | null
          old_rank_id?: string | null
          player_id?: string | null
          promotion_date?: string | null
          season?: number | null
          total_points_earned?: number | null
        }
        Update: {
          id?: string
          new_rank_id?: string | null
          old_rank_id?: string | null
          player_id?: string | null
          promotion_date?: string | null
          season?: number | null
          total_points_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ranking_history_new_rank_id_fkey"
            columns: ["new_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_history_old_rank_id_fkey"
            columns: ["old_rank_id"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ranking_snapshots: {
        Row: {
          created_at: string | null
          current_streak: number
          elo_rating: number
          id: string
          losses: number
          peak_elo: number | null
          player_id: string | null
          rank_position: number | null
          rank_tier: string
          snapshot_date: string
          total_matches: number
          win_rate: number
          wins: number
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          elo_rating: number
          id?: string
          losses?: number
          peak_elo?: number | null
          player_id?: string | null
          rank_position?: number | null
          rank_tier: string
          snapshot_date?: string
          total_matches?: number
          win_rate?: number
          wins?: number
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          elo_rating?: number
          id?: string
          losses?: number
          peak_elo?: number | null
          player_id?: string | null
          rank_position?: number | null
          rank_tier?: string
          snapshot_date?: string
          total_matches?: number
          win_rate?: number
          wins?: number
        }
        Relationships: []
      }
      ranks: {
        Row: {
          code: string
          created_at: string | null
          elo_points_required: number | null
          id: string
          level: number
          name: string
          requirements: Json | null
          skill_description: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          elo_points_required?: number | null
          id?: string
          level: number
          name: string
          requirements?: Json | null
          skill_description?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          elo_points_required?: number | null
          id?: string
          level?: number
          name?: string
          requirements?: Json | null
          skill_description?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_claimed: boolean | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_claimed?: boolean | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          id: string
          points_cost: number
          redeemed_at: string | null
          reward_type: string
          reward_value: string
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          points_cost: number
          redeemed_at?: string | null
          reward_type: string
          reward_value: string
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          points_cost?: number
          redeemed_at?: string | null
          reward_type?: string
          reward_value?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      season_rankings: {
        Row: {
          created_at: string | null
          id: string
          matches_played: number | null
          matches_won: number | null
          player_id: string | null
          points: number | null
          rank_position: number | null
          season_id: string | null
          tournaments_played: number | null
          tournaments_won: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          matches_played?: number | null
          matches_won?: number | null
          player_id?: string | null
          points?: number | null
          rank_position?: number | null
          season_id?: string | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          matches_played?: number | null
          matches_won?: number | null
          player_id?: string | null
          points?: number | null
          rank_position?: number | null
          season_id?: string | null
          tournaments_played?: number | null
          tournaments_won?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "season_rankings_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_summaries: {
        Row: {
          created_at: string | null
          final_rank_id: string | null
          id: string
          matches_played: number | null
          player_id: string
          season_number: number
          total_spa_points: number | null
          tournaments_won: number | null
        }
        Insert: {
          created_at?: string | null
          final_rank_id?: string | null
          id?: string
          matches_played?: number | null
          player_id: string
          season_number: number
          total_spa_points?: number | null
          tournaments_won?: number | null
        }
        Update: {
          created_at?: string | null
          final_rank_id?: string | null
          id?: string
          matches_played?: number | null
          player_id?: string
          season_number?: number
          total_spa_points?: number | null
          tournaments_won?: number | null
        }
        Relationships: []
      }
      season_tournaments: {
        Row: {
          created_at: string | null
          id: string
          points_multiplier: number | null
          season_id: string | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_multiplier?: number | null
          season_id?: string | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points_multiplier?: number | null
          season_id?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "season_tournaments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_tournaments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          point_system: Json | null
          rules: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          point_system?: Json | null
          rules?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          point_system?: Json | null
          rules?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          business_license: string | null
          business_name: string | null
          business_type: string | null
          contact_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          rating: number | null
          return_policies: string | null
          shipping_policies: string | null
          social_links: Json | null
          tax_id: string | null
          total_reviews: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          business_license?: string | null
          business_name?: string | null
          business_type?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          rating?: number | null
          return_policies?: string | null
          shipping_policies?: string | null
          social_links?: Json | null
          tax_id?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          business_license?: string | null
          business_name?: string | null
          business_type?: string | null
          contact_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          rating?: number | null
          return_policies?: string | null
          shipping_policies?: string | null
          social_links?: Json | null
          tax_id?: string | null
          total_reviews?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          booking_date: string
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          payment_status: string | null
          service_id: string | null
          start_time: string
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          availability_schedule: Json | null
          club_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_available: boolean | null
          max_capacity: number | null
          name: string
          price: number
          requires_booking: boolean | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          max_capacity?: number | null
          name: string
          price: number
          requires_booking?: boolean | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_available?: boolean | null
          max_capacity?: number | null
          name?: string
          price?: number
          requires_booking?: boolean | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      spa_milestones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          milestone_type: string
          reward_spa: number
          threshold: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type: string
          reward_spa: number
          threshold: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: string
          reward_spa?: number
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      spa_points_log: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          player_id: string | null
          points_earned: number
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          player_id?: string | null
          points_earned: number
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          player_id?: string | null
          points_earned?: number
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_spa_points_player"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          message: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type: string
          message: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          message?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      table_bookings: {
        Row: {
          booking_date: string
          check_in_time: string | null
          check_out_time: string | null
          club_id: string
          created_at: string | null
          duration_hours: number
          end_time: string
          hourly_rate: number
          id: string
          notes: string | null
          payment_status: string | null
          pool_table_id: string | null
          start_time: string
          status: string | null
          table_number: number
          total_cost: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          club_id: string
          created_at?: string | null
          duration_hours: number
          end_time: string
          hourly_rate: number
          id?: string
          notes?: string | null
          payment_status?: string | null
          pool_table_id?: string | null
          start_time: string
          status?: string | null
          table_number: number
          total_cost: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          club_id?: string
          created_at?: string | null
          duration_hours?: number
          end_time?: string
          hourly_rate?: number
          id?: string
          notes?: string | null
          payment_status?: string | null
          pool_table_id?: string | null
          start_time?: string
          status?: string | null
          table_number?: number
          total_cost?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_bookings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_bookings_pool_table_id_fkey"
            columns: ["pool_table_id"]
            isOneToOne: false
            referencedRelation: "pool_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      test_player_rankings: {
        Row: {
          created_at: string | null
          elo: number | null
          id: string
          losses: number | null
          player_id: string
          spa_points: number | null
          total_matches: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          elo?: number | null
          id?: string
          losses?: number | null
          player_id: string
          spa_points?: number | null
          total_matches?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          elo?: number | null
          id?: string
          losses?: number | null
          player_id?: string
          spa_points?: number | null
          total_matches?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_player_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "test_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      test_profiles: {
        Row: {
          activity_status: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          district: string | null
          full_name: string
          id: string
          phone: string | null
          role: string | null
          skill_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_status?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          full_name: string
          id?: string
          phone?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_status?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          display_name?: string | null
          district?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string | null
          skill_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      test_tournament_registrations: {
        Row: {
          created_at: string | null
          id: string
          payment_status: string | null
          player_id: string
          registration_date: string | null
          registration_status: string | null
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          player_id: string
          registration_date?: string | null
          registration_status?: string | null
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          player_id?: string
          registration_date?: string | null
          registration_status?: string | null
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_brackets: {
        Row: {
          bracket_config: Json | null
          bracket_data: Json
          bracket_type: string | null
          created_at: string | null
          current_round: number | null
          id: string
          status: string | null
          total_players: number
          total_rounds: number
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          bracket_config?: Json | null
          bracket_data: Json
          bracket_type?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          status?: string | null
          total_players: number
          total_rounds: number
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          bracket_config?: Json | null
          bracket_data?: Json
          bracket_type?: string | null
          created_at?: string | null
          current_round?: number | null
          id?: string
          status?: string | null
          total_players?: number
          total_rounds?: number
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_brackets_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_matches: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          bracket_id: string | null
          bracket_position: number | null
          created_at: string | null
          id: string
          live_stream_url: string | null
          loser_id: string | null
          match_notes: string | null
          match_number: number
          metadata: Json | null
          next_match: number | null
          notes: string | null
          player1_id: string | null
          player2_id: string | null
          previous_match_1: number | null
          previous_match_2: number | null
          referee_id: string | null
          round_number: number
          scheduled_time: string | null
          score_player1: number | null
          score_player2: number | null
          status: string | null
          tournament_id: string | null
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          bracket_id?: string | null
          bracket_position?: number | null
          created_at?: string | null
          id?: string
          live_stream_url?: string | null
          loser_id?: string | null
          match_notes?: string | null
          match_number: number
          metadata?: Json | null
          next_match?: number | null
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          previous_match_1?: number | null
          previous_match_2?: number | null
          referee_id?: string | null
          round_number: number
          scheduled_time?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          bracket_id?: string | null
          bracket_position?: number | null
          created_at?: string | null
          id?: string
          live_stream_url?: string | null
          loser_id?: string | null
          match_notes?: string | null
          match_number?: number
          metadata?: Json | null
          next_match?: number | null
          notes?: string | null
          player1_id?: string | null
          player2_id?: string | null
          previous_match_1?: number | null
          previous_match_2?: number | null
          referee_id?: string | null
          round_number?: number
          scheduled_time?: string | null
          score_player1?: number | null
          score_player2?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_bracket_id_fkey"
            columns: ["bracket_id"]
            isOneToOne: false
            referencedRelation: "tournament_brackets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tournament_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          checked_in_at: string | null
          created_at: string | null
          id: string
          player_stats: Json | null
          registration_status: string | null
          seed_number: number | null
          tournament_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string | null
          id?: string
          player_stats?: Json | null
          registration_status?: string | null
          seed_number?: number | null
          tournament_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string | null
          id?: string
          player_stats?: Json | null
          registration_status?: string | null
          seed_number?: number | null
          tournament_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_realtime_stats: {
        Row: {
          bracket_generated: boolean | null
          checked_in_participants: number | null
          completed_matches: number | null
          current_participants: number | null
          id: string
          last_activity: string | null
          prize_distributed: boolean | null
          total_matches: number | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          bracket_generated?: boolean | null
          checked_in_participants?: number | null
          completed_matches?: number | null
          current_participants?: number | null
          id?: string
          last_activity?: string | null
          prize_distributed?: boolean | null
          total_matches?: number | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bracket_generated?: boolean | null
          checked_in_participants?: number | null
          completed_matches?: number | null
          current_participants?: number | null
          id?: string
          last_activity?: string | null
          prize_distributed?: boolean | null
          total_matches?: number | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_realtime_stats_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          added_by_admin: string | null
          admin_notes: string | null
          bracket_position: number | null
          check_in_time: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_confirmed_at: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          player_id: string | null
          registration_date: string | null
          registration_status: string | null
          seed_number: number | null
          status: string | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          added_by_admin?: string | null
          admin_notes?: string | null
          bracket_position?: number | null
          check_in_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          player_id?: string | null
          registration_date?: string | null
          registration_status?: string | null
          seed_number?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by_admin?: string | null
          admin_notes?: string | null
          bracket_position?: number | null
          check_in_time?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_confirmed_at?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          player_id?: string | null
          registration_date?: string | null
          registration_status?: string | null
          seed_number?: number | null
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_added_by_admin_fkey"
            columns: ["added_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tournament_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          created_at: string | null
          elo_points_earned: number | null
          final_position: number
          id: string
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          performance_rating: number | null
          player_id: string | null
          prize_money: number | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          elo_points_earned?: number | null
          final_position: number
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          performance_rating?: number | null
          player_id?: string | null
          prize_money?: number | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          elo_points_earned?: number | null
          final_position?: number
          id?: string
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          performance_rating?: number | null
          player_id?: string | null
          prize_money?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_seeding: {
        Row: {
          created_at: string | null
          elo_rating: number | null
          id: string
          is_bye: boolean | null
          player_id: string | null
          registration_order: number
          seed_position: number
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          elo_rating?: number | null
          id?: string
          is_bye?: boolean | null
          player_id?: string | null
          registration_order: number
          seed_position: number
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          elo_rating?: number | null
          id?: string
          is_bye?: boolean | null
          player_id?: string | null
          registration_order?: number
          seed_position?: number
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_seeding_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_workflow_steps: {
        Row: {
          automation_data: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          step_name: string
          step_number: number
          step_status: string | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          automation_data?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          step_name: string
          step_number: number
          step_status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          automation_data?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          step_name?: string
          step_number?: number
          step_status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_workflow_steps_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_image: string | null
          bracket_generated: boolean | null
          club_id: string | null
          contact_info: Json | null
          created_at: string
          created_by: string | null
          current_participants: number | null
          description: string | null
          end_date: string | null
          entry_fee: number | null
          first_prize: number | null
          game_format: string | null
          id: string
          is_public: boolean | null
          management_status: string | null
          matches_scheduled: boolean | null
          max_participants: number | null
          max_rank_requirement: string | null
          min_rank_requirement: string | null
          min_trust_score: number | null
          name: string
          prize_pool: number | null
          rank_requirement: string[] | null
          registration_deadline: string | null
          registration_end: string | null
          registration_start: string | null
          requires_approval: boolean | null
          rules: string | null
          second_prize: number | null
          start_date: string | null
          status: string | null
          third_prize: number | null
          tier: string | null
          tournament_end: string | null
          tournament_start: string | null
          tournament_type: string | null
          updated_at: string
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          banner_image?: string | null
          bracket_generated?: boolean | null
          club_id?: string | null
          contact_info?: Json | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          first_prize?: number | null
          game_format?: string | null
          id?: string
          is_public?: boolean | null
          management_status?: string | null
          matches_scheduled?: boolean | null
          max_participants?: number | null
          max_rank_requirement?: string | null
          min_rank_requirement?: string | null
          min_trust_score?: number | null
          name: string
          prize_pool?: number | null
          rank_requirement?: string[] | null
          registration_deadline?: string | null
          registration_end?: string | null
          registration_start?: string | null
          requires_approval?: boolean | null
          rules?: string | null
          second_prize?: number | null
          start_date?: string | null
          status?: string | null
          third_prize?: number | null
          tier?: string | null
          tournament_end?: string | null
          tournament_start?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          banner_image?: string | null
          bracket_generated?: boolean | null
          club_id?: string | null
          contact_info?: Json | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          first_prize?: number | null
          game_format?: string | null
          id?: string
          is_public?: boolean | null
          management_status?: string | null
          matches_scheduled?: boolean | null
          max_participants?: number | null
          max_rank_requirement?: string | null
          min_rank_requirement?: string | null
          min_trust_score?: number | null
          name?: string
          prize_pool?: number | null
          rank_requirement?: string[] | null
          registration_deadline?: string | null
          registration_end?: string | null
          registration_start?: string | null
          requires_approval?: boolean | null
          rules?: string | null
          second_prize?: number | null
          start_date?: string | null
          status?: string | null
          third_prize?: number | null
          tier?: string | null
          tournament_end?: string | null
          tournament_start?: string | null
          tournament_type?: string | null
          updated_at?: string
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_communication_channels: {
        Row: {
          channel_address: string
          channel_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          updated_at: string | null
          user_id: string
          verification_expires_at: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          channel_address: string
          channel_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_expires_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          channel_address?: string
          channel_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_expires_at?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          auto_renew: boolean | null
          club_id: string | null
          created_at: string | null
          end_date: string
          id: string
          payment_id: string | null
          plan_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          club_id?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          club_id?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "club_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_penalties: {
        Row: {
          appeal_date: string | null
          appeal_decision: string | null
          appeal_decision_date: string | null
          appeal_reason: string | null
          appeal_reviewed_by: string | null
          created_at: string
          end_date: string | null
          id: string
          issued_by: string | null
          penalty_type: string
          reason: string
          severity: string
          start_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appeal_date?: string | null
          appeal_decision?: string | null
          appeal_decision_date?: string | null
          appeal_reason?: string | null
          appeal_reviewed_by?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          issued_by?: string | null
          penalty_type: string
          reason: string
          severity: string
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appeal_date?: string | null
          appeal_decision?: string | null
          appeal_decision_date?: string | null
          appeal_reason?: string | null
          appeal_reviewed_by?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          issued_by?: string | null
          penalty_type?: string
          reason?: string
          severity?: string
          start_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          language: string | null
          notification_challenges: boolean | null
          notification_marketing: boolean | null
          notification_tournaments: boolean | null
          privacy_show_phone: boolean | null
          privacy_show_stats: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          language?: string | null
          notification_challenges?: boolean | null
          notification_marketing?: boolean | null
          notification_tournaments?: boolean | null
          privacy_show_phone?: boolean | null
          privacy_show_stats?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          language?: string | null
          notification_challenges?: boolean | null
          notification_marketing?: boolean | null
          notification_tournaments?: boolean | null
          privacy_show_phone?: boolean | null
          privacy_show_stats?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_checkin_date: string | null
          longest_streak: number | null
          milestone_30_claimed: boolean | null
          milestone_60_claimed: boolean | null
          milestone_90_claimed: boolean | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_checkin_date?: string | null
          longest_streak?: number | null
          milestone_30_claimed?: boolean | null
          milestone_60_claimed?: boolean | null
          milestone_90_claimed?: boolean | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_checkin_date?: string | null
          longest_streak?: number | null
          milestone_30_claimed?: boolean | null
          milestone_60_claimed?: boolean | null
          milestone_90_claimed?: boolean | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          points_amount: number | null
          reference_id: string | null
          status: string | null
          transaction_category: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          points_amount?: number | null
          reference_id?: string | null
          status?: string | null
          transaction_category?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          points_amount?: number | null
          reference_id?: string | null
          status?: string | null
          transaction_category?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          points_balance: number | null
          status: string | null
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          points_balance?: number | null
          status?: string | null
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      all_profiles: {
        Row: {
          activity_status: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          display_name: string | null
          district: string | null
          full_name: string | null
          phone: string | null
          profile_type: string | null
          role: string | null
          skill_level: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_users_to_tournament: {
        Args: {
          p_tournament_id: string
          p_user_ids: string[]
          p_admin_id: string
          p_notes?: string
        }
        Returns: Json
      }
      admin_create_test_users: {
        Args: { user_data: Json[] }
        Returns: Json
      }
      admin_create_test_users_safe: {
        Args: { user_data: Json[] }
        Returns: Json
      }
      admin_register_test_users_to_tournament: {
        Args: { p_tournament_id: string; p_test_user_ids: string[] }
        Returns: Json
      }
      admin_register_test_users_to_tournament_final: {
        Args: { p_tournament_id: string; p_test_user_ids: string[] }
        Returns: Json
      }
      admin_register_test_users_to_tournament_safe: {
        Args: { p_tournament_id: string; p_test_user_ids: string[] }
        Returns: Json
      }
      advance_tournament_winner: {
        Args: { p_match_id: string; p_tournament_id: string }
        Returns: Json
      }
      apply_automatic_penalty: {
        Args: { player_uuid: string }
        Returns: undefined
      }
      apply_points_decay: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      approve_club_registration: {
        Args: {
          registration_id: string
          approver_id: string
          approved: boolean
          comments?: string
        }
        Returns: Json
      }
      auto_update_tournament_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      automated_season_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      award_challenge_points: {
        Args: {
          p_winner_id: string
          p_loser_id: string
          p_wager_points: number
          p_rank_difference?: number
        }
        Returns: number
      }
      award_tournament_elo_points: {
        Args: {
          p_player_id: string
          p_tournament_id: string
          p_placement: string
        }
        Returns: number
      }
      award_tournament_points: {
        Args: {
          p_tournament_id: string
          p_player_id: string
          p_position: number
          p_player_rank: string
        }
        Returns: number
      }
      calculate_achievement_points: {
        Args: { placement: string }
        Returns: number
      }
      calculate_average_opponent_strength: {
        Args: { p_player_id: string }
        Returns: number
      }
      calculate_challenge_spa: {
        Args: {
          p_winner_id: string
          p_loser_id: string
          p_wager_amount: number
          p_race_to: number
        }
        Returns: {
          winner_spa: number
          loser_spa: number
          daily_count: number
          reduction_applied: boolean
        }[]
      }
      calculate_comeback_bonus: {
        Args: { p_player_id: string }
        Returns: number
      }
      calculate_match_elo: {
        Args: { p_match_result_id: string }
        Returns: Json
      }
      calculate_performance_quality: {
        Args: { p_player_id: string }
        Returns: number
      }
      calculate_streak_bonus: {
        Args: { p_player_id: string; p_base_points: number }
        Returns: number
      }
      calculate_tournament_spa: {
        Args:
          | {
              p_position: number
              p_player_rank: string
              p_tournament_type?: string
            }
          | { p_position: number; p_rank_code: string }
        Returns: number
      }
      calculate_trust_score: {
        Args: { player_uuid: string }
        Returns: undefined
      }
      can_generate_bracket: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      check_and_award_milestones: {
        Args: { p_player_id: string }
        Returns: Json
      }
      check_rank_promotion: {
        Args: { p_player_id: string }
        Returns: boolean
      }
      check_season_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      club_confirm_payment: {
        Args: {
          p_registration_id: string
          p_club_user_id: string
          p_payment_method?: string
          p_notes?: string
        }
        Returns: Json
      }
      complete_challenge_match: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_loser_id: string
          p_wager_points?: number
        }
        Returns: Json
      }
      complete_challenge_match_with_bonuses: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_loser_id: string
          p_base_points?: number
        }
        Returns: Json
      }
      complete_challenge_with_daily_limits: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_loser_id: string
          p_wager_amount: number
          p_race_to: number
        }
        Returns: Json
      }
      complete_tournament_match: {
        Args: {
          p_match_id: string
          p_winner_id: string
          p_player1_score?: number
          p_player2_score?: number
        }
        Returns: Json
      }
      create_bulk_notifications: {
        Args: { notifications: Json }
        Returns: undefined
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_type: string
          notification_title: string
          notification_message: string
          notification_action_url?: string
          notification_metadata?: Json
          notification_priority?: string
        }
        Returns: string
      }
      create_test_demo_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      credit_spa_points: {
        Args: {
          p_user_id: string
          p_amount: number
          p_category: string
          p_description: string
          p_reference_id?: string
        }
        Returns: undefined
      }
      daily_checkin: {
        Args: { user_uuid: string }
        Returns: Json
      }
      debit_spa_points: {
        Args: {
          p_user_id: string
          p_amount: number
          p_category: string
          p_description: string
          p_reference_id?: string
        }
        Returns: boolean
      }
      decay_inactive_spa_points: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_club_completely: {
        Args: { club_profile_id: string; admin_id: string }
        Returns: Json
      }
      example_function: {
        Args: { param1: string }
        Returns: string
      }
      expire_old_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_advanced_tournament_bracket: {
        Args: {
          p_tournament_id: string
          p_seeding_method?: string
          p_force_regenerate?: boolean
        }
        Returns: Json
      }
      generate_complete_tournament_bracket: {
        Args: { p_tournament_id: string; p_seeding_method?: string }
        Returns: Json
      }
      generate_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      generate_single_elimination_bracket: {
        Args: { p_tournament_id: string; p_participants: string[] }
        Returns: string
      }
      generate_tournament_bracket: {
        Args: { tournament_uuid: string }
        Returns: Json
      }
      get_available_demo_users: {
        Args: { needed_count: number }
        Returns: {
          user_id: string
          full_name: string
          display_name: string
          skill_level: string
          elo: number
          spa_points: number
        }[]
      }
      get_cron_jobs: {
        Args: Record<PropertyKey, never>
        Returns: {
          jobid: number
          schedule: string
          command: string
          nodename: string
          nodeport: number
          database: string
          username: string
          active: boolean
          jobname: string
        }[]
      }
      get_demo_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_inactive_players: {
        Args: { days_threshold: number }
        Returns: {
          user_id: string
          last_activity: string
        }[]
      }
      get_notification_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_notification_summary: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_time_multiplier: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_tournament_bracket_status: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_tournament_registration_priority: {
        Args: { p_tournament_id: string }
        Returns: {
          registration_id: string
          player_id: string
          tournament_id: string
          payment_status: string
          registration_status: string
          registration_date: string
          player_name: string
          elo_rating: number
          priority_order: number
          payment_method: string
          admin_notes: string
        }[]
      }
      get_tournament_registrations: {
        Args: { tournament_uuid: string }
        Returns: {
          id: string
          user_id: string
          registration_date: string
          status: string
          payment_status: string
          notes: string
          user_profile: Json
        }[]
      }
      get_user_admin_status: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_notifications_read: {
        Args: { notification_ids: string[] }
        Returns: undefined
      }
      populate_initial_leaderboard_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_rankings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      redeem_reward: {
        Args: {
          user_uuid: string
          reward_type: string
          reward_value: string
          points_cost: number
        }
        Returns: Json
      }
      refresh_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_current_month_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      release_demo_users: {
        Args: { tournament_id: string }
        Returns: Json
      }
      reseed_tournament: {
        Args: { p_tournament_id: string; p_seeding_method?: string }
        Returns: Json
      }
      reserve_demo_users: {
        Args: { user_ids: string[]; tournament_id: string }
        Returns: Json
      }
      reset_daily_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_season: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      seed_demo_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      send_enhanced_notification: {
        Args: {
          p_user_id: string
          p_template_key: string
          p_variables?: Json
          p_override_priority?: string
          p_scheduled_at?: string
        }
        Returns: string
      }
      send_monthly_reports: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      system_health_check: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_monthly_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_rank_verification_simple: {
        Args: {
          verification_id: string
          new_status: string
          verifier_id: string
        }
        Returns: Json
      }
      update_tournament_management_status: {
        Args: {
          p_tournament_id: string
          p_new_status: string
          p_completed_by?: string
        }
        Returns: Json
      }
      update_tournament_participants: {
        Args: { tournament_id: string; increment?: number }
        Returns: undefined
      }
      update_weekly_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_match_result: {
        Args: {
          p_match_result_id: string
          p_verifier_id: string
          p_verification_method?: string
        }
        Returns: Json
      }
      verify_tournament_database: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
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
