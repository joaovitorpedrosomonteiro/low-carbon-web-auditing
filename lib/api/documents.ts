import { apiClient } from './client';

export type DocumentGenerationStatus =
  | 'pending'
  | 'awaiting_signature'
  | 'verifying'
  | 'completed'
  | 'failed';

export interface DocumentStatus {
  inventoryId: string;
  status: DocumentGenerationStatus;
  errorMsg: string | null;
}

export interface SignedDocument {
  id: string;
  inventoryId: string;
  gcsUri: string;
  signedAt: string;
  auditorName: string;
}

export interface DocumentListResponse {
  data: SignedDocument[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
    total_count: number;
  };
}

export async function getDocumentStatus(inventoryId: string): Promise<DocumentStatus> {
  const response = await apiClient.get(`/v1/documents/${inventoryId}/status`);
  return response.data;
}

export async function getUnsignedDocumentUrl(inventoryId: string): Promise<string> {
  const response = await apiClient.get(`/v1/documents/${inventoryId}/unsigned`);
  return response.data.downloadUrl;
}

export async function getSignedDocumentUrl(inventoryId: string): Promise<string> {
  const response = await apiClient.get(`/v1/documents/${inventoryId}`);
  return response.data.downloadUrl;
}

export async function uploadSignedDocument(
  inventoryId: string,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await apiClient.post(`/v1/documents/${inventoryId}/signed`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function retryDocument(inventoryId: string): Promise<void> {
  await apiClient.post(`/v1/documents/${inventoryId}/retry`);
}

export async function getDocuments(
  after?: string,
  limit = 20
): Promise<DocumentListResponse> {
  const params = new URLSearchParams();
  if (after) params.set('after', after);
  params.set('limit', String(limit));

  const response = await apiClient.get(`/v1/documents?${params.toString()}`);
  return response.data;
}
