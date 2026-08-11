import { apiClient } from './client';

export interface Phase1Payload {
  session_id: string;
  user_message: string;
  target_companies?: string[];
  target_roles?: string[];
  preparation_duration_days?: number;
}

export interface Phase2Payload {
  session_id: string;
  additional_context?: Record<string, any>;
}

export const pipelineApi = {
  runPhase1: async (payload: Phase1Payload) => {
    const res = await apiClient.post('/pipeline/phase1', payload);
    return res.data;
  },
  runPhase2: async (payload: Phase2Payload) => {
    const res = await apiClient.post('/pipeline/phase2', payload);
    return res.data;
  },
  generateTopicRecall: async (topic: string, targetCompany?: string, sessionId?: string) => {
    const res = await apiClient.post('/pipeline/recall-topic', {
      topic,
      target_company: targetCompany || 'Target Company',
      session_id: sessionId || 'active_session',
    });
    return res.data;
  },
};

