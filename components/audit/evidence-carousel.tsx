'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAIJob, useSubmitReliabilityJob } from '@/lib/hooks/use-ai-jobs';
import { useAuthStore } from '@/lib/store/auth';
import { ReliabilityBadge } from './reliability-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Loader2,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Emission, Evidence } from '@/lib/api/inventories';

// PDF.js worker setup
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfjs() {
  if (!pdfjsLib && typeof window !== 'undefined') {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

const thumbnailCache = new Map<string, string>();

async function renderPdfThumbnail(url: string, linkId: string): Promise<string | null> {
  if (thumbnailCache.has(linkId)) {
    return thumbnailCache.get(linkId)!;
  }

  const pdfjs = await loadPdfjs();
  if (!pdfjs) return null;

  try {
    const loadingTask = pdfjs.getDocument(url);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const scale = 0.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    if (!context) return null;

    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    thumbnailCache.set(linkId, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semana(s) atrás`;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

interface EvidenceCardProps {
  evidence: Evidence;
  jobId: string | null;
  inventoryId: string;
}

function EvidenceCard({ evidence, jobId, inventoryId }: EvidenceCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loadingThumb, setLoadingThumb] = useState(true);
  const { data: job } = useAIJob(jobId);

  const perLinkReasoning = job?.status === 'completed' && job.result
    ? job.result.perLink?.find((l) => l.linkId === evidence.id)?.reasoning
    : null;

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingThumb(true);
      try {
        const thumb = await renderPdfThumbnail(evidence.path, evidence.id);
        if (!cancelled) {
          setThumbnail(thumb);
        }
      } catch {
        // ignore
      }
      if (!cancelled) setLoadingThumb(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [evidence.path, evidence.id]);

  const handleOpen = () => {
    window.open(evidence.path, '_blank');
  };

  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-lg border bg-card shadow-sm">
      <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-t-lg bg-muted">
        {loadingThumb ? (
          <Skeleton className="h-full w-full rounded-t-lg" />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={evidence.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      <div className="p-3">
        <p
          className="truncate text-sm font-medium"
          title={evidence.name}
        >
          {evidence.name.length > 28
            ? evidence.name.slice(0, 28) + '...'
            : evidence.name}
        </p>
        <div className="mt-1">
          <ReliabilityBadge jobId={jobId} linkId={evidence.id} compact />
        </div>
        {perLinkReasoning && (
          <div className="mt-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-left text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? perLinkReasoning : perLinkReasoning.slice(0, 50) + (perLinkReasoning.length > 50 ? '...' : '')}
            </button>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={handleOpen}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Abrir
        </Button>
      </div>
    </div>
  );
}

interface EvidenceCarouselProps {
  emission: Emission;
  inventoryId: string;
}

export function EvidenceCarousel({ emission, inventoryId }: EvidenceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const submitJob = useSubmitReliabilityJob();
  const { user } = useAuthStore();

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      checkScroll();
    }
  }, [emission.id, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 240;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleRequestAI = async () => {
    if (!user) return;
    const evidenceUris = emission.evidences.map((e) => e.path);
    submitJob.mutate({
      emissionId: emission.id,
      evidenceUris,
      inventoryId,
    });
  };

  if (emission.evidences.length === 0) {
    return (
      <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-6">
        <p className="text-sm text-muted-foreground">
          Nenhuma evidência carregada para esta emissão.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestAI}
          disabled={submitJob.isPending}
        >
          {submitJob.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Solicitar Avaliação IA
        </Button>
      </div>
    );
  }

  return (
    <div className="relative border-b bg-muted/30">
      <div className="flex items-center gap-2 px-6 py-3">
        <p className="shrink-0 text-sm font-medium text-muted-foreground">
          Evidências ({emission.evidences.length})
        </p>
        <ReliabilityBadge jobId={emission.reliabilityJobID} />
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRequestAI}
          disabled={submitJob.isPending}
        >
          {submitJob.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Solicitar Avaliação IA
        </Button>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background p-1.5 shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-none"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {emission.evidences.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              jobId={emission.reliabilityJobID}
              inventoryId={inventoryId}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border bg-background p-1.5 shadow-md"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
