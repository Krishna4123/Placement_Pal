import { apiClient } from './client';

export interface VaultQueryPayload {
  query: string;
  collection_name?: string;
  n_results?: number;
}

export interface TopicCreatePayload {
  name: string;
  category: string;
  subtopics?: string[];
  resources?: string[];
  difficulty?: string;
  tags?: string[];
}

export const vaultApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/vault/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  queryVault: async (payload: VaultQueryPayload) => {
    const res = await apiClient.post('/vault/query', payload);
    return res.data;
  },
  createTopic: async (payload: TopicCreatePayload) => {
    const res = await apiClient.post('/vault/topics', payload);
    return res.data;
  },
  deleteTopic: async (topicId: string) => {
    const res = await apiClient.delete(`/vault/topics/${topicId}`);
    return res.data;
  },
};
