import { apiClient } from './client';

export interface MarkTaskPayload {
  session_id: string;
  task_id: string;
  status: 'pending' | 'in_progress' | 'done' | 'skipped';
}

export interface AdvanceDayPayload {
  session_id: string;
  target_day?: number;
}

export const planApi = {
  markTask: async (payload: MarkTaskPayload) => {
    const res = await apiClient.post('/plan/mark-task', payload);
    return res.data;
  },
  advanceDay: async (payload: AdvanceDayPayload) => {
    const res = await apiClient.post('/plan/advance-day', payload);
    return res.data;
  },
};
