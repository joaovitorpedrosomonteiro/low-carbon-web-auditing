'use client';

import { Badge } from '@/components/ui/badge';
import { ReliabilityBadge } from './reliability-badge';
import { cn } from '@/lib/utils';
import type { Emission } from '@/lib/api/inventories';

interface EmissionListProps {
  emissions: Emission[];
  selectedId: string | null;
  onSelect: (emission: Emission) => void;
}

function scopeBadgeClass(scope: string): string {
  if (scope.includes('1')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (scope.includes('2')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (scope.includes('3')) return 'bg-green-100 text-green-800 border-green-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function evaluateFormula(
  expression: string,
  variables: Array<{ name: string; observedValue: number | null }>,
  constants: number[]
): number | null {
  let expr = expression;
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

export function EmissionList({ emissions, selectedId, onSelect }: EmissionListProps) {
  return (
    <div className="p-6">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Emissões ({emissions.length})
      </h3>
      <div className="space-y-2">
        {emissions.map((emission) => {
          const tco2e = evaluateFormula(
            emission.formula.expression,
            emission.formula.variables,
            emission.formula.constants || []
          );
          const isSelected = selectedId === emission.id;

          return (
            <button
              key={emission.id}
              onClick={() => onSelect(emission)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary'
              )}
            >
              <Badge
                className={cn(
                  'shrink-0 border',
                  scopeBadgeClass(emission.category.scope)
                )}
              >
                {emission.category.scope}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{emission.name}</p>
                <p className="text-xs text-muted-foreground">
                  {emission.category.name}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold">
                  {tco2e !== null
                    ? `${tco2e.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} tCO2e`
                    : '—'}
                </p>
              </div>
              <div className="shrink-0">
                <Badge variant="outline" className="text-xs">
                  {emission.evidences.length} evid.
                </Badge>
              </div>
              <div className="shrink-0">
                <ReliabilityBadge
                  jobId={emission.reliabilityJobID}
                  compact
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
