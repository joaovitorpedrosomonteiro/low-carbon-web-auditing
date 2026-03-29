'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAIJob,
  submitReliabilityJob,
  type AIJob,
} from '@/lib/api/ai';
import { updateReliabilityJobId } from '@/lib/api/inventories';

export function useAIJob(jobId: string | null) {
  return useQuery<AIJob>({
    queryKey: ['ai-job', jobId],
    queryFn: () => getAIJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'processing') {
        return 5000;
      }
      return false;
    },
  });
}

export function useSubmitReliabilityJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      emissionId,
      evidenceUris,
    }: {
      emissionId: string;
      evidenceUris: string[];
      inventoryId: string;
    }) => submitReliabilityJob(emissionId, evidenceUris),
    onSuccess: async (data, variables) => {
      await updateReliabilityJobId(
        variables.inventoryId,
        variables.emissionId,
        data.jobId
      );
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.inventoryId] });
    },
  });
}
