'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDocumentStatus,
  getUnsignedDocumentUrl,
  uploadSignedDocument,
  retryDocument,
} from '@/lib/api/documents';
import { useTransitionState } from '@/lib/hooks/use-inventories';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  Loader2,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  FileKey,
  ShieldCheck,
} from 'lucide-react';
import type { Inventory } from '@/lib/api/inventories';

interface SigningFlowProps {
  inventory: Inventory;
}

function useDocumentStatus(inventoryId: string) {
  return useQuery({
    queryKey: ['document-status', inventoryId],
    queryFn: () => getDocumentStatus(inventoryId),
    enabled: !!inventoryId,
    refetchInterval: (query: { state: { data?: { status?: string } } }) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'verifying') {
        return 5000;
      }
      return false;
    },
  });
}

function useDownloadUnsigned(inventoryId: string) {
  return useMutation({
    mutationFn: () => getUnsignedDocumentUrl(inventoryId),
  });
}

function useUploadSigned(inventoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadSignedDocument(inventoryId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-status', inventoryId] });
    },
  });
}

export function SigningFlow({ inventory }: SigningFlowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'confirm' | 'signing'>('confirm');
  const [signedFile, setSignedFile] = useState<File | null>(null);

  const transition = useTransitionState(inventory.id);
  const { data: docStatus, isLoading: docStatusLoading } = useDocumentStatus(inventory.id);
  const downloadUnsigned = useDownloadUnsigned(inventory.id);
  const uploadMutation = useUploadSigned(inventory.id);

  const handleConfirm = async () => {
    transition.mutate(
      {
        toState: 'audited',
        version: inventory.version,
      },
      {
        onSuccess: () => {
          setStep('signing');
          toast({ title: 'Inventário marcado como auditado' });
          queryClient.invalidateQueries({ queryKey: ['document-status', inventory.id] });
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: { message?: string } } } };
          toast({
            title: 'Erro',
            description:
              err.response?.data?.error?.message || 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDownloadUnsigned = async () => {
    downloadUnsigned.mutate(undefined, {
      onSuccess: (url) => {
        window.open(url, '_blank');
      },
      onError: () => {
        toast({
          title: 'Erro ao baixar documento',
          description: 'Tente novamente.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignedFile(file);
    }
  };

  const handleUploadSigned = async () => {
    if (!signedFile) return;

    uploadMutation.mutate(signedFile, {
      onSuccess: () => {
        toast({ title: 'Documento assinado enviado com sucesso' });
        setStep('confirm');
        queryClient.invalidateQueries({ queryKey: ['document-status', inventory.id] });
        router.push('/documents');
      },
      onError: () => {
        toast({
          title: 'Erro ao enviar documento',
          description: 'Verifique a assinatura e tente novamente.',
          variant: 'destructive',
        });
      },
    });
  };

  const handleRetry = () => {
    retryDocument(inventory.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['document-status', inventory.id] });
      toast({ title: 'Geração de documento reiniciada' });
    });
  };

  if (step === 'confirm') {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Confirmar Auditoria</CardTitle>
          <CardDescription>
            Inventário: <strong>{inventory.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  Ao confirmar, este inventário será marcado como auditado.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Um documento PDF será gerado para assinatura digital usando seu
                  certificado ICP-Brasil. Esta ação é irreversível.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={transition.isPending}>
              {transition.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Auditoria
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = docStatus?.status;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Assinatura Digital ICP-Brasil</CardTitle>
        <CardDescription>
          Inventário: <strong>{inventory.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status do documento:</span>
          {docStatusLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Badge
              className={
                status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : status === 'awaiting_signature'
                    ? 'bg-blue-100 text-blue-800'
                    : status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
              }
            >
              {status || 'pending'}
            </Badge>
          )}
        </div>

        {status === 'pending' && (
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Gerando documento PDF...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto o documento é gerado.
              </p>
            </div>
          </div>
        )}

        {status === 'awaiting_signature' && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="mb-2 font-semibold">
                Instruções de Assinatura
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <FileKey className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-medium">Certificado A3 (Token/Smartcard)</p>
                    <p className="text-muted-foreground">
                      Insira seu token ou smartcard ICP-Brasil, baixe o documento,
                      utilize o software do fabricante para assinar o PDF
                      e carregue o arquivo assinado abaixo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="font-medium">Certificado A1 (Software)</p>
                    <p className="text-muted-foreground">
                      Baixe o documento, utilize seu aplicativo de assinatura
                      digital (ex.: USBToken, DigiSign) para assinar o PDF
                      com seu certificado A1 e carregue o arquivo assinado.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Fallback Desktop</p>
                    <p className="text-muted-foreground">
                      Se preferir, baixe o documento, assine-o externamente
                      no seu computador e carregue o PDF assinado aqui.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadUnsigned}
                disabled={downloadUnsigned.isPending}
              >
                {downloadUnsigned.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar PDF
              </Button>
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selecionar PDF Assinado
              </Button>
              {signedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {signedFile.name}
                </p>
              )}
            </div>

            {signedFile && (
              <Button
                onClick={handleUploadSigned}
                disabled={uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Enviar Documento Assinado
              </Button>
            )}
          </div>
        )}

        {status === 'completed' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Documento assinado e verificado
                </p>
                <p className="text-sm text-green-700">
                  O documento assinado foi aceito e armazenado.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    Falha na verificação
                  </p>
                  <p className="text-sm text-red-700">
                    {docStatus?.errorMsg || 'A verificação da assinatura falhou.'}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleRetry}>
              Tentar Novamente
            </Button>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push(`/inventories/${inventory.id}`)}>
            Voltar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
