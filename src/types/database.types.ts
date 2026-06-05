export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string
          mode: 'v2' | 'legacy'
          legacy_settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          mode?: 'v2' | 'legacy'
          legacy_settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          mode?: 'v2' | 'legacy'
          legacy_settings?: any
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
        }
        Update: {
          name?: string
        }
      }
      workspace_members: {
        Row: {
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
        }
      }
      workspace_settings: {
        Row: {
          workspace_id: string
          business_name: string | null
          timezone: string | null
          working_hours: string | null
          active_ai_provider: string | null
          openai_key: string | null
          claude_key: string | null
          telegram_bot_token: string | null
          telegram_webhook_url: string | null
          telegram_connected: boolean | null
          calendar_client_id: string | null
          calendar_client_secret: string | null
          calendar_id: string | null
          calendar_connected: boolean | null
          sheets_client_id: string | null
          sheets_client_secret: string | null
          sheets_url: string | null
          sheets_connected: boolean | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      leads: {
        Row: {
          id: string
          workspace_id: string
          full_name: string
          email: string | null
          phone: string | null
          source: string | null
          business_type: string | null
          lead_score: number | null
          intent: 'low' | 'medium' | 'high' | null
          urgency: 'low' | 'medium' | 'high' | 'urgent' | null
          status: 'new' | 'qualified' | 'contacted' | 'converted' | 'lost' | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      lead_intelligence: {
        Row: {
          lead_id: string
          workspace_id: string
          qualification: string | null
          priority: 'low' | 'medium' | 'high' | 'critical' | null
          health_score: number | null
          opportunity: string | null
          recommended_action: string | null
          last_generated_at: string
        }
        Insert: any
        Update: any
      }
      conversation_threads: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string
          status: 'active' | 'paused' | 'closed' | null
          ai_mode: string | null
          created_at: string
          updated_at: string
          leads?: {
            full_name: string
            email: string | null
          }
        }
        Insert: any
        Update: any
      }
      conversations: {
        Row: {
          id: string
          thread_id: string
          workspace_id: string
          sender_type: 'human_operator' | 'ai_agent' | 'lead'
          message_body: string
          channel: string | null
          is_read: boolean | null
          created_at: string
        }
        Insert: any
        Update: any
      }
      ai_memories: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string
          source_message_id: string | null
          created_by: 'human' | 'ai' | null
          confidence_score: number | null
          memory_type: 'preference' | 'behavior' | 'context' | 'intent' | 'objection' | 'timeline' | 'budget' | null
          memory_value: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      appointments: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string
          appointment_start: string
          appointment_end: string
          meeting_link: string | null
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show' | null
          google_event_id: string | null
          reminder_sent: boolean | null
          created_at: string
          updated_at: string
          leads?: {
            full_name: string
            email: string | null
          }
        }
        Insert: any
        Update: any
      }
      follow_ups: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string
          scheduled_time: string
          message_payload: string | null
          status: 'pending' | 'sent' | 'failed' | 'paused' | null
          created_at: string
          updated_at: string
          leads?: {
            full_name: string
            email: string | null
          }
        }
        Insert: any
        Update: any
      }
      business_knowledge: {
        Row: {
          id: string
          workspace_id: string
          key: string
          value: string | null
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      audit_logs: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          timestamp: string
        }
        Insert: any
        Update: any
      }
      notifications: {
        Row: {
          id: string
          workspace_id: string
          user_id: string | null
          type: 'ai_escalation' | 'follow_up' | 'appointment' | 'system'
          title: string | null
          message: string | null
          link: string | null
          is_read: boolean | null
          created_at: string
        }
        Insert: any
        Update: any
      }
    }
    Functions: {
      get_kpi_metrics: {
        Args: {
          p_workspace_id: string
          p_start_date: string
        }
        Returns: {
          total_leads: number
          total_revenue: number
          conversion_rate: number
          active_conversations: number
        }[]
      }
      get_funnel_stats: {
        Args: {
          p_workspace_id: string
          p_start_date: string
        }
        Returns: {
          status: string
          count: number
        }[]
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type WorkspaceRole = "owner" | "admin" | "member";
