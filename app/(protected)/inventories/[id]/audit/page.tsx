'use client';

import { useParams, useRouter } from 'next/navigation';
import { useInventory } from '@/lib/hooks/use-inventories';
import { SigningFlow } from '@/components/audit/signing-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: inventory, isLoading, error } = useInventory(id);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  if (error || !inventory) {
    return (
      <div className="p-6">
        <p className="text-destructive">Erro ao carregar inventário.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      <SigningFlow inventory={inventory} />
    </div>
  );
}
