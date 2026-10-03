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

  return await res.json();
}

export const api = {
  createRequest: async (payload: CreateRideRequestPayload): Promise<RideRequest> => {
    const data = await request<any>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data?.request || data;
  },

  getRequests: async (mine?: boolean): Promise<RideRequest[]> => {
    try {
      const query = mine ? '?mine=true' : '';
      const data = await request<any>(`/requests${query}`);
      if (data && Array.isArray(data.requests)) return data.requests;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getRequests failed:', err);
      return [];
    }
  },

  getCurrentTrip: async (): Promise<RideRequest | null> => {
    try {
      const data = await request<any>('/trips/current');
      if (data && data.trip !== undefined) return data.trip;
      if (data && data.id) return data;
      return null;
    } catch (err) {
      console.error('getCurrentTrip failed:', err);
      return null;
    }
  },

  acceptRequest: async (id: string): Promise<RideRequest> => {
    const data = await request<any>(`/requests/${id}/accept`, {
      method: 'POST',
    });
    return data?.trip || data;
  },

  startTrip: async (id: string): Promise<RideRequest> => {
    const data = await request<any>(`/trips/${id}/start`, {
      method: 'POST',
    });
    return data?.trip || data;
  },

  updateBoarding: async (tripId: string, payload: BoardingUpdatePayload): Promise<RideRequest> => {
    const data = await request<any>(`/trips/${tripId}/boarding`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data?.trip || data;
  },

  completeTrip: async (id: string): Promise<{ message: string; trip: RideRequest }> => {
    const data = await request<any>(`/trips/${id}/complete`, {
      method: 'POST',
    });
    return data;
  },

  getPersonHistory: async (name: string): Promise<PersonHistoryItem[]> => {
    try {
      const data = await request<any>(`/history/person/${encodeURIComponent(name)}`);
      if (data && Array.isArray(data.history)) return data.history;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getPersonHistory failed:', err);
      return [];
    }
  },

  getMyHistory: async (): Promise<PersonHistoryItem[]> => {
    try {
      const data = await request<any>('/history/me');
      if (data && Array.isArray(data.history)) return data.history;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getMyHistory failed:', err);
      return [];
    }
  },

  getRiderHistory: async (): Promise<RiderHistoryItem[]> => {
    try {
      const data = await request<any>('/history/rider');
      if (data && Array.isArray(data.history)) return data.history;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getRiderHistory failed:', err);
      return [];
    }
  },

  // Admin APIs
  getAdminOverview: async (): Promise<AdminOverviewStats | null> => {
    try {
      const data = await request<any>('/admin/overview');
      return data?.stats || data || null;
    } catch (err) {
      console.error('getAdminOverview failed:', err);
      return null;
    }
  },

  getAdminUsers: async (): Promise<AdminUserItem[]> => {
    try {
      const data = await request<any>('/admin/users');
      if (data && Array.isArray(data.users)) return data.users;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getAdminUsers failed:', err);
      return [];
    }
  },

  getAdminRequests: async (): Promise<any[]> => {
    try {
      const data = await request<any>('/admin/requests');
      if (data && Array.isArray(data.requests)) return data.requests;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getAdminRequests failed:', err);
      return [];
    }
  },

  getAdminTrips: async (): Promise<any[]> => {
    try {
      const data = await request<any>('/admin/trips');
      if (data && Array.isArray(data.trips)) return data.trips;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.error('getAdminTrips failed:', err);
      return [];
    }
  },
};
