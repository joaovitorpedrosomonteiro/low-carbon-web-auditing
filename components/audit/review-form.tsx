'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTransitionState } from '@/lib/hooks/use-inventories';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import type { Inventory } from '@/lib/api/inventories';

interface ReviewFormProps {
  inventory: Inventory;
}

export function ReviewForm({ inventory }: ReviewFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const transition = useTransitionState(inventory.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Por favor, insira uma mensagem de revisão.',
        variant: 'destructive',
      });
      return;
    }

    transition.mutate(
      {
        toState: 'for_review',
        reviewMessage: message.trim(),
        version: inventory.version,
      },
      {
        onSuccess: () => {
          toast({ title: 'Revisão enviada com sucesso' });
          router.push(`/inventories/${inventory.id}`);
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { error?: { message?: string } } } };
          toast({
            title: 'Erro ao enviar revisão',
            description:
              err.response?.data?.error?.message || 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Enviar para Revisão</CardTitle>
        <CardDescription>
          Inventario: <strong>{inventory.name}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-message">Mensagem de Revisão</Label>
            <Textarea
              id="review-message"
              placeholder="Descreva os problemas encontrados e as correções necessárias..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={transition.isPending}>
              {transition.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar Revisão
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
