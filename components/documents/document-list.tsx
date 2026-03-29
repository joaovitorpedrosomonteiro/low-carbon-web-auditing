'use client';

import { useState } from 'react';
import { useDocuments } from '@/lib/hooks/use-documents';
import { getSignedDocumentUrl } from '@/lib/api/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { Download, FileText, Loader2 } from 'lucide-react';

export function DocumentList() {
  const [after, setAfter] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useDocuments(after);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (inventoryId: string) => {
    setDownloadingId(inventoryId);
    try {
      const url = await getSignedDocumentUrl(inventoryId);
      window.open(url, '_blank');
    } catch {
      toast({
        title: 'Erro ao baixar documento',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos Assinados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos Assinados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Erro ao carregar documentos.</p>
        </CardContent>
      </Card>
    );
  }

  const documents = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos Assinados</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum documento assinado encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    Inventário {doc.inventoryId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assinado por {doc.auditorName} em{' '}
                    {new Date(doc.signedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.inventoryId)}
                  disabled={downloadingId === doc.inventoryId}
                >
                  {downloadingId === doc.inventoryId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}

            {data?.pagination.has_more && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAfter(data.pagination.next_cursor || undefined)}
              >
                Carregar mais
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
