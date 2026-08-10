import { apiClient } from './client';

export interface ParsedNotification {
  company: string | null;
  target_role: string | null;
  interview_date: string | null;       // actual interview/drive date (YYYY-MM-DD)
  deadline_date: string | null;        // registration deadline (YYYY-MM-DD)
  preparation_duration_days: number;
  process_rounds: string[];
  tech_stack: string[];
  stipend: string | null;              // monthly stipend e.g. "20000"
  location: string | null;            // work location
  eligibility: string | null;         // brief eligibility criteria
  ctc: string | null;                 // full-time CTC if mentioned
}

export const parseApi = {
  parseNotification: async (sessionId: string, notificationText: string): Promise<ParsedNotification> => {
    const res = await apiClient.post('/pipeline/parse-notification', {
      session_id: sessionId,
      notification_text: notificationText,
    });
    return res.data?.data as ParsedNotification;
  },
};
