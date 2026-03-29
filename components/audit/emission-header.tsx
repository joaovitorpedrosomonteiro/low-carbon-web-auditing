'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Emission, InventoryState } from '@/lib/api/inventories';

interface EmissionHeaderProps {
  emission: Emission;
  state: InventoryState;
}

function scopeBadgeClass(scope: string): string {
  if (scope.includes('1')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (scope.includes('2')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (scope.includes('3')) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function scopeLabel(scope: string): string {
  return scope;
}

function evaluateFormula(
  expression: string,
  variables: Array<{ name: string; observedValue: number | null }>,
  constants: number[]
): number | null {
  let expr = expression;
  let constIdx = 0;
  for (const v of variables) {
    if (v.observedValue === null) return null;
    expr = expr.replaceAll(v.name, String(v.observedValue));
  }
  for (const c of constants) {
    expr = expr.replaceAll(String(c), String(c));
  }
  try {
    const result = Function('"use strict"; return (' + expr + ')')();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function buildFormulaDisplay(
  expression: string,
  variables: Array<{ name: string; observedValue: number | null; unit: string }>,
  constants: number[]
): string {
  let expr = expression;
  for (const v of variables) {
    const val = v.observedValue !== null ? v.observedValue.toLocaleString('pt-BR') : '?';
    expr = expr.replaceAll(v.name, `${v.name} (${val} ${v.unit})`);
  }
  return expr;
}

export function EmissionHeader({ emission, state }: EmissionHeaderProps) {
  const [isOpen, setIsOpen] = useState(true);

  const calculatedValue = useMemo(() => {
    return evaluateFormula(
      emission.formula.expression,
      emission.formula.variables,
      emission.formula.constants || []
    );
  }, [emission.formula]);

  const formulaDisplay = useMemo(() => {
    return buildFormulaDisplay(
      emission.formula.expression,
      emission.formula.variables,
      emission.formula.constants || []
    );
  }, [emission.formula]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="sticky top-14 z-30 border-b bg-card"
    >
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <h2 className="text-lg font-bold">{emission.name}</h2>
          <Badge className={cn('border', scopeBadgeClass(emission.category.scope))}>
            {scopeLabel(emission.category.scope)}
          </Badge>
        </div>
        <Badge variant="outline" className="text-xs">
          {state}
        </Badge>
      </div>

      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-4 px-6 pb-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Categoria</p>
            <p className="text-sm">{emission.category.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Tipo de Gás</p>
            <p className="text-sm">
              <span className="font-mono font-semibold">{emission.gasType.symbol}</span>
              <span className="ml-2 text-muted-foreground">{emission.gasType.name}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">tCO2e Calculado</p>
            <p className={cn(
              'text-xl font-bold',
              calculatedValue !== null ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {calculatedValue !== null
                ? `${calculatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} tCO2e`
                : 'Variáveis incompletas'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Evidências</p>
            <p className="text-sm">{emission.evidences.length} arquivo(s)</p>
          </div>
        </div>

        <div className="px-6 pb-2">
          <p className="text-xs font-medium text-muted-foreground">Fórmula</p>
          <p className="font-mono text-sm">{formulaDisplay}</p>
        </div>

        {emission.formula.variables.length > 0 && (
          <div className="px-6 pb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Variáveis</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium">Nome</th>
                    <th className="px-3 py-1.5 text-left font-medium">Valor</th>
                    <th className="px-3 py-1.5 text-left font-medium">Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {emission.formula.variables.map((v) => (
                    <tr key={v.name} className="border-t">
                      <td className="px-3 py-1.5">{v.name}</td>
                      <td className="px-3 py-1.5 font-mono">
                        {v.observedValue !== null
                          ? v.observedValue.toLocaleString('pt-BR')
                          : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{v.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
