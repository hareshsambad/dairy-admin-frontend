import api from './api';
import type { LoginRequest, LoginResponse, AuthUser } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { accessToken, user } = response.data;
    localStorage.setItem('milk_admin_token', accessToken);
    localStorage.setItem('milk_admin_user', JSON.stringify(user));
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('milk_admin_token');
    localStorage.removeItem('milk_admin_user');
  },

  getToken(): string | null {
    return localStorage.getItem('milk_admin_token');
  },

  getUser(): AuthUser | null {
    const userStr = localStorage.getItem('milk_admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as AuthUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
