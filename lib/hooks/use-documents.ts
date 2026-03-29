'use client';

import { useQuery } from '@tanstack/react-query';
import { getDocuments } from '@/lib/api/documents';

export function useDocuments(after?: string) {
  return useQuery({
    queryKey: ['documents', after],
    queryFn: () => getDocuments(after),
  });
}
