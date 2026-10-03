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
    const data = await request<{ success: boolean; request: RideRequest }>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.request || (data as unknown as RideRequest);
  },

  getRequests: async (mine?: boolean): Promise<RideRequest[]> => {
    const query = mine ? '?mine=true' : '';
    const data = await request<{ success: boolean; requests: RideRequest[] }>(`/requests${query}`);
    return data.requests || (Array.isArray(data) ? data : []);
  },

  getCurrentTrip: async (): Promise<RideRequest | null> => {
    const data = await request<{ success: boolean; trip: RideRequest | null }>('/trips/current');
    return data.trip !== undefined ? data.trip : (data as unknown as RideRequest | null);
  },

  acceptRequest: async (id: string): Promise<RideRequest> => {
    const data = await request<{ success: boolean; trip: RideRequest }>(`/requests/${id}/accept`, {
      method: 'POST',
    });
    return data.trip || (data as unknown as RideRequest);
  },

  startTrip: async (id: string): Promise<RideRequest> => {
    const data = await request<{ success: boolean; trip: RideRequest }>(`/trips/${id}/start`, {
      method: 'POST',
    });
    return data.trip || (data as unknown as RideRequest);
  },

  updateBoarding: async (tripId: string, payload: BoardingUpdatePayload): Promise<RideRequest> => {
    const data = await request<{ success: boolean; id: string; status: any; passengers: any[] }>(`/trips/${tripId}/boarding`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data as unknown as RideRequest;
  },

  completeTrip: async (id: string): Promise<{ message: string; trip: RideRequest }> => {
    const data = await request<{ success: boolean; message: string; trip: RideRequest }>(`/trips/${id}/complete`, {
      method: 'POST',
    });
    return data;
  },

  getPersonHistory: async (name: string): Promise<PersonHistoryItem[]> => {
    const data = await request<{ success: boolean; history: PersonHistoryItem[] }>(`/history/person/${encodeURIComponent(name)}`);
    return data.history || (Array.isArray(data) ? data : []);
  },

  getMyHistory: async (): Promise<PersonHistoryItem[]> => {
    const data = await request<{ success: boolean; history: PersonHistoryItem[] }>('/history/me');
    return data.history || (Array.isArray(data) ? data : []);
  },

  getRiderHistory: async (): Promise<RiderHistoryItem[]> => {
    const data = await request<{ success: boolean; history: RiderHistoryItem[] }>('/history/rider');
    return data.history || (Array.isArray(data) ? data : []);
  },

  // Admin APIs
  getAdminOverview: async (): Promise<AdminOverviewStats> => {
    const data = await request<{ success: boolean; stats: AdminOverviewStats }>('/admin/overview');
    return data.stats;
  },

  getAdminUsers: async (): Promise<AdminUserItem[]> => {
    const data = await request<{ success: boolean; users: AdminUserItem[] }>('/admin/users');
    return data.users || [];
  },

  getAdminRequests: async (): Promise<any[]> => {
    const data = await request<{ success: boolean; requests: any[] }>('/admin/requests');
    return data.requests || [];
  },

  getAdminTrips: async (): Promise<any[]> => {
    const data = await request<{ success: boolean; trips: any[] }>('/admin/trips');
    return data.trips || [];
  },
};
