import { AuthUser, LoginCredentials, SignupData, Role } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_STORAGE_KEY = 'lawazia_auth_session';

export const authService = {
  getSavedSession(): AuthUser | null {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  saveSession(user: AuthUser): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  },

  clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  async login(credentials: LoginCredentials, expectedRole?: Role): Promise<AuthUser> {
    const trimmedEmail = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      const message = data.message || 'Invalid email or password. Please verify your credentials.';
      throw new Error(message);
    }

    const user: AuthUser = {
      id: String(data.user.id),
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      token: data.token,
      createdAt: data.user.createdAt || data.user.created_at,
    };

    if (expectedRole && user.role !== expectedRole) {
      throw new Error(`Access denied. Your account has the role "${user.role}", but this portal requires "${expectedRole}".`);
    }

    this.saveSession(user);
    return user;
  },

  async signup(data: SignupData, targetRole: 'USER' | 'RIDER'): Promise<AuthUser> {
    if ((targetRole as any) === 'ADMIN') {
      throw new Error('Public registration for Administrator is strictly prohibited.');
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Full name must be at least 2 characters long.');
    }

    if (!data.email || !data.email.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const endpoint = targetRole === 'RIDER' ? `${API_BASE_URL}/auth/rider/signup` : `${API_BASE_URL}/auth/signup`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok || !body.success) {
      const message = body.message || 'Account registration failed.';
      throw new Error(message);
    }

    const newUser: AuthUser = {
      id: String(body.user.id),
      name: body.user.name,
      email: body.user.email,
      role: body.user.role,
      token: body.token,
      createdAt: body.user.createdAt || body.user.created_at,
    };

    this.saveSession(newUser);
    return newUser;
  },
};
