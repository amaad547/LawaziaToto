import {
  RideRequest,
  CreateRideRequestPayload,
  BoardingUpdatePayload,
  PersonHistoryItem,
  RiderHistoryItem,
  AdminOverviewStats,
  AdminUserItem,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const AUTH_STORAGE_KEY = 'lawazia_auth_session';

function getAuthToken(): string | null {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return null;
    const session = JSON.parse(saved);
    return session.token || null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 409) {
    const errorBody = await res.json().catch(() => ({ error: 'CLASH', message: 'Trip conflict detected.' }));
    const error = new Error(errorBody.message || 'Clash error');
    (error as any).status = 409;
    (error as any).code = errorBody.error || 'CLASH';
    throw error;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: 'Server error' }));
    const error = new Error(errorBody.message || `HTTP error ${res.status}`);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  return data as T;
}

export const api = {
  createRequest: async (payload: CreateRideRequestPayload): Promise<RideRequest> => {
    const data = await request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.request || data;
  },

  getRequests: async (mine?: boolean): Promise<RideRequest[]> => {
    const query = mine ? '?mine=true' : '';
    const data = await request<any>(`/requests${query}`);
    if (data && Array.isArray(data.requests)) return data.requests;
    if (Array.isArray(data)) return data;
    return [];
  },

  getCurrentTrip: async (): Promise<RideRequest | null> => {
    const data = await request<any>('/trips/current');
    if (data && data.trip !== undefined) return data.trip;
    return data || null;
  },

  acceptRequest: async (id: string): Promise<RideRequest> => {
    const data = await request<any>(`/requests/${id}/accept`, {
      method: 'POST',
    });
    return data.trip || data;
  },

  startTrip: async (id: string): Promise<RideRequest> => {
    const data = await request<any>(`/trips/${id}/start`, {
      method: 'POST',
    });
    return data.trip || data;
  },

  updateBoarding: async (tripId: string, payload: BoardingUpdatePayload): Promise<RideRequest> => {
    const data = await request<any>(`/trips/${tripId}/boarding`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.trip || data;
  },

  completeTrip: async (id: string): Promise<{ message: string; trip: RideRequest }> => {
    const data = await request<any>(`/trips/${id}/complete`, {
      method: 'POST',
    });
    return data;
  },

  getPersonHistory: async (name: string): Promise<PersonHistoryItem[]> => {
    const data = await request<any>(`/history/person/${encodeURIComponent(name)}`);
    if (data && Array.isArray(data.history)) return data.history;
    if (Array.isArray(data)) return data;
    return [];
  },

  getMyHistory: async (): Promise<PersonHistoryItem[]> => {
    const data = await request<any>('/history/me');
    if (data && Array.isArray(data.history)) return data.history;
    if (Array.isArray(data)) return data;
    return [];
  },

  getRiderHistory: async (): Promise<RiderHistoryItem[]> => {
    const data = await request<any>('/history/rider');
    if (data && Array.isArray(data.history)) return data.history;
    if (Array.isArray(data)) return data;
    return [];
  },

  // Admin APIs
  getAdminOverview: async (): Promise<AdminOverviewStats> => {
    const data = await request<any>('/admin/overview');
    return data.stats || data;
  },

  getAdminUsers: async (): Promise<AdminUserItem[]> => {
    const data = await request<any>('/admin/users');
    return data.users || (Array.isArray(data) ? data : []);
  },

  getAdminRequests: async (): Promise<any[]> => {
    const data = await request<any>('/admin/requests');
    return data.requests || (Array.isArray(data) ? data : []);
  },

  getAdminTrips: async (): Promise<any[]> => {
    const data = await request<any>('/admin/trips');
    return data.trips || (Array.isArray(data) ? data : []);
  },
};
