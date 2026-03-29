import { apiClient } from './client';

export type AIJobType = 'estimate_reliability';

export type AIJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ReliabilityPerLink {
  linkId: string;
  score: number;
  reasoning: string;
}

export interface ReliabilityReport {
  emissionId: string;
  overallScore: number;
  perLink: ReliabilityPerLink[];
}

export interface AIJob {
  id: string;
  type: AIJobType;
  status: AIJobStatus;
  requestedBy: string;
  createdAt: string;
  completedAt: string | null;
  result: ReliabilityReport | null;
  errorMsg: string | null;
}

export async function submitReliabilityJob(
  emissionId: string,
  evidenceUris: string[]
): Promise<{ jobId: string }> {
  const response = await apiClient.post('/v1/ai/jobs/estimate-reliability', {
    emissionId,
    evidenceUris,
  });
  return response.data;
}

export async function getAIJob(jobId: string): Promise<AIJob> {
  const response = await apiClient.get(`/v1/ai/jobs/${jobId}`);
  return response.data;
}
