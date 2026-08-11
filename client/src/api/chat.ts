import { apiClient } from './client';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestPayload {
  session_id?: string;
  message: string;
  history?: ChatMessagePayload[];
  current_page?: string;
}

export interface ChatResponseData {
  reply: string;
  current_page: string;
  target_company: string;
  target_role: string;
}

export const chatApi = {
  sendMessage: async (payload: ChatRequestPayload) => {
    const res = await apiClient.post('/chat', payload);
    return res.data;
  },
};
