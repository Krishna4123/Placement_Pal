import { apiClient } from './client';

export interface DebugPayload {
  node_name: string;
  company_name?: string;
  user_message?: string;
  target_roles?: string[];
  duration_days?: number;
  topics?: string[];
}

export const debugApi = {
  testNode: async (payload: DebugPayload) => {
    const res = await apiClient.post('/debug/node', payload);
    return res.data;
  },
};
