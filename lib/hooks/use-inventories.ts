'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInventories,
  getInventory,
  getAssignedInventories,
  transitionState,
  type InventoryFilters,
  type TransitionStateRequest,
} from '@/lib/api/inventories';

export function useInventories(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventories', filters],
    queryFn: () => getInventories(filters),
  });
}

export function useInventory(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => getInventory(id),
    enabled: !!id,
  });
}

export function useAssignedInventories() {
  return useQuery({
    queryKey: ['inventories', 'assigned'],
    queryFn: () => getAssignedInventories(),
    refetchInterval: 30000,
  });
}

export function useTransitionState(inventoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransitionStateRequest) =>
      transitionState(inventoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', inventoryId] });
      queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
  });
}
