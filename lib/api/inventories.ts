import { apiClient } from './client';

export type InventoryState =
  | 'to_report_emissions'
  | 'to_provide_evidence'
  | 'for_auditing'
  | 'for_review'
  | 'audited';

export interface Variable {
  name: string;
  unit: string;
  observedValue: number | null;
}

export interface Formula {
  expression: string;
  variables: Variable[];
  constants: number[];
}

export interface GasType {
  symbol: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  scope: string;
}

export interface Evidence {
  id: string;
  name: string;
  path: string;
  storageType: string;
}

export interface Emission {
  id: string;
  name: string;
  gasType: GasType;
  formula: Formula;
  category: Category;
  evidences: Evidence[];
  reliabilityJobID: string | null;
  version: number;
}

export interface Inventory {
  id: string;
  name: string;
  month: number;
  year: number;
  state: InventoryState;
  emissions: Emission[];
  templateId: string;
  companyBranchId: string;
  gwpStandardId: string;
  version: number;
  reviewMessage?: string;
}

export interface InventoryListResponse {
  data: Inventory[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
    total_count: number;
  };
}

export interface InventoryFilters {
  state?: InventoryState;
  limit?: number;
  after?: string;
}

export interface TransitionStateRequest {
  toState: InventoryState;
  reviewMessage?: string;
  version: number;
}

export async function getInventories(
  filters: InventoryFilters = {}
): Promise<InventoryListResponse> {
  const params = new URLSearchParams();
  if (filters.state) params.set('state', filters.state);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.after) params.set('after', filters.after);

  const response = await apiClient.get(`/v1/inventories?${params.toString()}`);
  return response.data;
}

export async function getInventory(id: string): Promise<Inventory> {
  const response = await apiClient.get(`/v1/inventories/${id}`);
  return response.data;
}

export async function getAssignedInventories(): Promise<InventoryListResponse> {
  const params = new URLSearchParams();
  params.set('state', 'for_auditing');
  params.set('limit', '50');

  const response = await apiClient.get(`/v1/inventories?${params.toString()}`);
  return response.data;
}

export async function transitionState(
  inventoryId: string,
  data: TransitionStateRequest
): Promise<Inventory> {
  const response = await apiClient.patch(
    `/v1/inventories/${inventoryId}/state`,
    data
  );
  return response.data;
}

export async function getEvidenceDownloadUrl(evidencePath: string): Promise<string> {
  const response = await apiClient.get(`/v1/files/${encodeURIComponent(evidencePath)}`);
  return response.data.downloadUrl;
}

export async function updateReliabilityJobId(
  inventoryId: string,
  emissionId: string,
  jobId: string
): Promise<void> {
  await apiClient.patch(
    `/v1/inventories/${inventoryId}/emissions/${emissionId}/reliability-job`,
    { jobId }
  );
}
