'use client';

import { useAIJob } from '@/lib/hooks/use-ai-jobs';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReliabilityBadgeProps {
  jobId: string | null;
  linkId?: string;
  compact?: boolean;
}

export function ReliabilityBadge({ jobId, linkId, compact }: ReliabilityBadgeProps) {
  const { data: job } = useAIJob(jobId);

  if (!jobId) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground',
        compact && 'px-1.5 py-0 text-[10px]'
      )}>
        <AlertCircle className="h-3 w-3" />
        Não avaliado
      </span>
    );
  }

  if (!job || job.status === 'pending' || job.status === 'processing') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-muted-foreground',
        compact && 'px-1.5 py-0 text-[10px]'
      )}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {compact ? '...' : 'Processando...'}
      </span>
    );
  }

  if (job.status === 'failed') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700',
        compact && 'px-1.5 py-0 text-[10px]'
      )}>
        <XCircle className="h-3 w-3" />
        Erro
      </span>
    );
  }

  if (job.status === 'completed' && job.result) {
    let score: number | null = null;
    if (linkId) {
      const perLink = job.result.perLink?.find((l) => l.linkId === linkId);
      score = perLink ? perLink.score : null;
    } else {
      score = job.result.overallScore;
    }

    if (score === null) return null;

    const pct = Math.round(score * 100);
    const color =
      score >= 0.7
        ? 'border-green-200 bg-green-50 text-green-700'
        : score >= 0.4
          ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
          : 'border-red-200 bg-red-50 text-red-700';

    return (
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        color,
        compact && 'px-1.5 py-0 text-[10px]'
      )}>
        <CheckCircle2 className="h-3 w-3" />
        {pct}%
      </span>
    );
  }

  return null;
}
