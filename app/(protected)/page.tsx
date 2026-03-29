'use client';

import { useAssignedInventories } from '@/lib/hooks/use-inventories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FileSearch, Clock } from 'lucide-react';

export default function AssignedInventoriesPage() {
  const { data, isLoading, error } = useAssignedInventories();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inventários Atribuídos</h1>
        <p className="text-sm text-muted-foreground">
          Inventários em estado de auditoria atribuídos a você.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">
              Erro ao carregar inventários. Tente novamente.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSearch className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Nenhum inventário atribuído</p>
            <p className="text-sm text-muted-foreground">
              Não há inventários pendentes de auditoria no momento.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((inventory) => (
            <Link
              key={inventory.id}
              href={`/inventories/${inventory.id}`}
              className="block"
            >
              <Card className="transition-colors hover:border-primary/50 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {inventory.name}
                    </CardTitle>
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                      Para Auditoria
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {String(inventory.month).padStart(2, '0')}/{inventory.year}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">
                      {inventory.emissions.length} emissão(ões)
                    </p>
                  </div>
                  {inventory.reviewMessage && (
                    <div className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-700">
                      Revisão anterior: {inventory.reviewMessage.slice(0, 80)}
                      {inventory.reviewMessage.length > 80 ? '...' : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
