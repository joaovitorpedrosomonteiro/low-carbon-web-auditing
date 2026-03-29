import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'SystemAdmin' | 'CompanyAdmin' | 'Employee' | 'Auditor';
    companyId?: string;
    branchId?: string;
    mustChangePassword: boolean;
  };
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post('/v1/auth/login', data);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/v1/auth/logout');
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiClient.post('/v1/auth/change-password', data);
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const response = await apiClient.post('/v1/auth/refresh');
  return response.data;
}
