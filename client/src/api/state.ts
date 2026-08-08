import { apiClient } from './client';

export interface PlacementState {
  session_id: string;
  phase: string;
  current_day: number;
  target_companies: string[];
  target_roles: string[];
  curriculum_days_total: number;
  errors: string[];
}

export const stateApi = {
  getState: async (sessionId: string) => {
    const res = await apiClient.get<{ success: boolean; data: PlacementState }>(`/state`, {
      params: { session_id: sessionId },
    });
    return res.data;
  },
};
