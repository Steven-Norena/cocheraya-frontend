import api from './api';

export interface AuthResponseData {
  token: string;
  refreshToken?: string;
  userId: number;
  name: string;
  email: string;
  role: 'DRIVER' | 'HOST' | 'ADMIN';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'DRIVER' | 'HOST';
}

export interface LoginRequest {
  email: string;
  password: string;
  fcmToken?: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponseData> {
    const response = await api.post<AuthResponseData>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponseData> {
    // We can provide a mock or test fcmToken by default if not set
    const requestData = {
      ...data,
      fcmToken: data.fcmToken || 'mock-fcm-token-123',
    };
    const response = await api.post<AuthResponseData>('/auth/login', requestData);
    return response.data;
  },

  logout() {
    localStorage.clear();
  },

  getCurrentUser(): AuthResponseData | null {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as AuthResponseData['role'] | null;
    const userId = localStorage.getItem('userId');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    
    if (token && role && userId && name && email) {
      return {
        token,
        role,
        userId: Number(userId),
        name,
        email,
      };
    }
    return null;
  }
};

export default authService;
