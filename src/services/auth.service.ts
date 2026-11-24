import api from './api';
import type { LoginRequest, LoginResponse, AuthUser } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/admin/login', credentials);
    const { accessToken, user } = response.data;
    const role = (user?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      throw new Error(
        'Access denied. This application is restricted to authorized administrators.',
      );
    }
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
      const u = JSON.parse(userStr) as AuthUser;
      const role = (u?.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'super_admin') {
        this.logout();
        return null;
      }
      return u;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    if (!token || !user) return false;
    const role = (user.role || '').toLowerCase();
    return role === 'admin' || role === 'super_admin';
  },

  async getProfile(): Promise<any> {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};
