import { apiClient } from './client';

export interface PlacementState {
  session_id: string;
  phase: string;
  current_day: number;
  target_companies: string[];
  target_roles: string[];
  preparation_duration_days: number;
  curriculum_days_total: number;
  errors: string[];
  created_at?: string;
  updated_at?: string;
  // Full pipeline outputs populated after parse + phase1 + phase2
  interpreted_intent?: Record<string, any> | null;
  company_intel?: Record<string, any> | null;
  vault_context?: any[] | null;
  recall_questions?: any[] | null;
  curriculum?: {
    title?: string;
    total_days?: number;
    days: Array<{
      day: number;
      title?: string;
      date?: string;
      focus_topics?: string[];
      tasks: Array<{
        task_id: string;
        title: string;
        type: string;
        difficulty: string;
        estimated_minutes: number;
        status: string;
        done?: boolean;
        priority?: string;
      }>;
    }>;
  } | null;
  // Raw parsed notification stored alongside session state
  parsed_notification?: Record<string, any> | null;
}

export const stateApi = {
  getState: async (sessionId: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlacementState }>(`/state`, {
      params: { session_id: sessionId },
    });
    return res.data;
  },
};
