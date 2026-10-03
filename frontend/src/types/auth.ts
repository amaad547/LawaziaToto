export type Role = 'USER' | 'RIDER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  token?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: 'USER' | 'RIDER';
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  message?: string;
}
