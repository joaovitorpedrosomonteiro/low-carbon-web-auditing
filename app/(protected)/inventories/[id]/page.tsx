'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventory } from '@/lib/hooks/use-inventories';
import { EmissionHeader } from '@/components/audit/emission-header';
import { EvidenceCarousel } from '@/components/audit/evidence-carousel';
import { EmissionList } from '@/components/audit/emission-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { Emission } from '@/lib/api/inventories';

export default function AuditInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: inventory, isLoading, error } = useInventory(id);
  const [selectedEmission, setSelectedEmission] = useState<Emission | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                Erro ao carregar inventário
              </p>
              <p className="text-sm text-red-700">
                {(error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
                  'Inventário não encontrado ou sem permissão de acesso.'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const emissions = inventory.emissions;
  const currentEmission = selectedEmission || (emissions.length > 0 ? emissions[0] : null);

  return (
    <div className="flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{inventory.name}</h1>
            <p className="text-xs text-muted-foreground">
              {String(inventory.month).padStart(2, '0')}/{inventory.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inventory.state === 'for_auditing' && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/inventories/${id}/review`)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Enviar para Revisão
              </Button>
              <Button
                onClick={() => router.push(`/inventories/${id}/audit`)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marcar como Auditado
              </Button>
            </>
          )}
          {inventory.state === 'for_review' && (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
              Em Revisão
            </Badge>
          )}
          {inventory.state === 'audited' && (
            <Badge className="bg-green-100 text-green-800 border border-green-200">
              Auditado
            </Badge>
          )}
        </div>
      </div>

      {/* Zone 1: Emission Header */}
      {currentEmission && (
        <EmissionHeader emission={currentEmission} state={inventory.state} />
      )}

      {/* Zone 2: Evidence Carousel */}
      {currentEmission && (
        <EvidenceCarousel emission={currentEmission} inventoryId={inventory.id} />
      )}

      {/* Emission List */}
      <EmissionList
        emissions={emissions}
        selectedId={currentEmission?.id || null}
        onSelect={setSelectedEmission}
      />

      {/* Previous review message */}
      {inventory.reviewMessage && inventory.state === 'for_auditing' && (
        <div className="mx-6 mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-medium text-amber-800">
            Mensagem de Revisão Anterior:
          </p>
          <p className="text-sm text-amber-700">{inventory.reviewMessage}</p>
        </div>
      )}
    </div>
  );
}
