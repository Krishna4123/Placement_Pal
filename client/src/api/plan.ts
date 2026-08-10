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

export interface TaskResourcesPayload {
  task_title: string;
  task_type: 'coding' | 'aptitude' | 'core';
}

export interface ResourceLink {
  title: string;
  url: string;
  source: string;
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
  taskResources: async (payload: TaskResourcesPayload) => {
    const res = await apiClient.post('/plan/task-resources', payload);
    return res.data;
  },
};
