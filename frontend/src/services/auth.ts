import { AuthUser, LoginCredentials, SignupData, Role } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_STORAGE_KEY = 'lawazia_auth_session';
const REGISTERED_USERS_KEY = 'lawazia_registered_accounts';

// Seed default accounts if not already present
function getStoredAccounts(): AuthUser[] {
  const data = localStorage.getItem(REGISTERED_USERS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }

  const defaultAccounts: AuthUser[] = [
    {
      id: 'admin_1',
      name: 'System Admin',
      email: 'admin@lawazia.edu',
      role: 'ADMIN',
      token: 'jwt_mock_admin_token',
      createdAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'rider_1',
      name: 'Shankar (Driver)',
      email: 'rider@lawazia.edu',
      role: 'RIDER',
      token: 'jwt_mock_rider_token',
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'user_1',
      name: 'Rahul Sharma',
      email: 'rahul@lawazia.edu',
      role: 'USER',
      token: 'jwt_mock_user_token',
      createdAt: '2026-10-01T10:00:00Z',
    },
  ];

  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

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

    // First attempt to call backend if endpoint exists
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          if (expectedRole && data.user.role !== expectedRole) {
            throw new Error(`This portal is restricted to ${expectedRole} accounts.`);
          }
          this.saveSession(data.user);
          return data.user;
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('restricted to')) {
        throw err;
      }
      // If backend endpoint is 404 or connection failed, use local accounts store
    }

    // Fallback account verification
    const accounts = getStoredAccounts();
    const matched = accounts.find((acc) => acc.email.toLowerCase() === trimmedEmail);

    if (!matched) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    if (expectedRole && matched.role !== expectedRole) {
      throw new Error(`Access denied. Your account has the role "${matched.role}", but this portal requires "${expectedRole}".`);
    }

    const authenticatedUser: AuthUser = {
      ...matched,
      token: `token_${Date.now()}_${matched.id}`,
    };

    this.saveSession(authenticatedUser);
    return authenticatedUser;
  },

  async signup(data: SignupData, targetRole: 'USER' | 'RIDER'): Promise<AuthUser> {
    if (targetRole as any === 'ADMIN') {
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

    // Try backend signup endpoint if available
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          password: data.password,
          role: targetRole,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        if (body.user) {
          this.saveSession(body.user);
          return body.user;
        }
      }
    } catch {
      // Backend not yet available, proceed to local account registration
    }

    const accounts = getStoredAccounts();
    const exists = accounts.some((acc) => acc.email.toLowerCase() === data.email.trim().toLowerCase());
    if (exists) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: targetRole,
      createdAt: new Date().toISOString(),
      token: `token_${Date.now()}`,
    };

    accounts.push(newUser);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
    this.saveSession(newUser);
    return newUser;
  },

  getAllAccounts(): AuthUser[] {
    return getStoredAccounts();
  }
};
