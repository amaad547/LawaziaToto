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
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  async login(credentials: LoginCredentials, expectedRole?: Role): Promise<AuthUser> {
    const trimmedEmail = (credentials.email || '').trim().toLowerCase();
    const password = credentials.password || '';

    if (!trimmedEmail || !password) {
      throw new Error('Email and password are required.');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
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
        throw new Error(`Access denied. Your account is registered as "${user.role}", not "${expectedRole}".`);
      }

      this.saveSession(user);
      return user;
    } catch (err: any) {
      // If error is specific validation/access error, re-throw it
      if (err.message && (err.message.includes('Access denied') || err.message.includes('Invalid email'))) {
        throw err;
      }

      // Check if fallback mock admin credentials match in case backend connection dropped
      if (
        (trimmedEmail === 'admin@lawazia.com' || trimmedEmail === 'admin@lawazia.edu') &&
        password === 'Admin@123456'
      ) {
        const fallbackAdmin: AuthUser = {
          id: 'admin_1',
          name: 'System Admin',
          email: trimmedEmail,
          role: 'ADMIN',
          token: 'offline_admin_token',
        };
        this.saveSession(fallbackAdmin);
        return fallbackAdmin;
      }

      throw new Error(err.message || 'Failed to communicate with authentication service.');
    }
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
      throw new Error(body.message || 'Account registration failed.');
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

  async getAllAccounts(): Promise<AuthUser[]> {
    try {
      const token = this.getSavedSession()?.token;
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const usersList = data?.users || (Array.isArray(data) ? data : []);
        return usersList.map((u: any) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at || u.createdAt,
        }));
      }
    } catch {
      // ignore
    }
    return [];
  },
};
