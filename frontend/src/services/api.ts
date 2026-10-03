import {
  RideRequest,
  CreateRideRequestPayload,
  BoardingUpdatePayload,
  PersonHistoryItem,
  RiderHistoryItem,
  Passenger
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// In-Memory Fallback Database for standalone frontend execution
let fallbackRequests: RideRequest[] = [
  {
    id: '101',
    from: 'College',
    to: 'Station',
    date: '2026-10-01',
    time: '15:00',
    passengerCount: 2,
    passengers: [
      { name: 'Rahul', status: 'BOARDED' },
      { name: 'Aman', status: 'MISSED' }
    ],
    status: 'COMPLETED',
    createdAt: '2026-10-01T14:30:00.000Z',
    completedAt: '2026-10-01T15:25:00.000Z'
  },
  {
    id: '102',
    from: 'Station',
    to: 'Office',
    date: '2026-10-02',
    time: '09:00',
    passengerCount: 1,
    passengers: [{ name: 'Priya', status: 'BOARDED' }],
    status: 'COMPLETED',
    createdAt: '2026-10-02T08:30:00.000Z',
    completedAt: '2026-10-02T09:20:00.000Z'
  }
];

let currentTripId: string | null = null;
let nextIdCounter = 103;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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
  } catch (err: any) {
    // If backend is unreachable (Failed to fetch), fallback seamlessly to mock logic for smooth testing
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return executeMockFallback<T>(endpoint, options);
    }
    throw err;
  }
}

// Fallback logic adhering strictly to API.md rules
function executeMockFallback<T>(endpoint: string, options: RequestInit): T {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : null;

  // 1. POST /api/requests
  if (endpoint === '/requests' && method === 'POST') {
    const payload: CreateRideRequestPayload = body;
    const newReq: RideRequest = {
      id: String(nextIdCounter++),
      from: payload.from,
      to: payload.to,
      date: payload.date,
      time: payload.time,
      passengerCount: payload.passengerCount,
      passengers: payload.passengers.map((name) => ({ name, status: 'PENDING' })),
      status: 'REQUESTED',
      createdAt: new Date().toISOString(),
    };
    fallbackRequests.unshift(newReq);
    return newReq as unknown as T;
  }

  // 2. GET /api/requests
  if (endpoint === '/requests' && method === 'GET') {
    return fallbackRequests as unknown as T;
  }

  // 3. GET /api/trips/current
  if (endpoint === '/trips/current' && method === 'GET') {
    if (!currentTripId) return null as unknown as T;
    const trip = fallbackRequests.find((r) => r.id === currentTripId && (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS'));
    return (trip || null) as unknown as T;
  }

  // 4. POST /api/requests/:id/accept
  const acceptMatch = endpoint.match(/^\/requests\/([^/]+)\/accept$/);
  if (acceptMatch && method === 'POST') {
    const id = acceptMatch[1];
    const targetReq = fallbackRequests.find((r) => r.id === id);
    if (!targetReq) {
      throw new Error('Request not found');
    }

    // Check clash: Is there already an active/accepted trip at the same date and time?
    const hasClash = fallbackRequests.some(
      (r) =>
        r.id !== id &&
        (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') &&
        r.date === targetReq.date &&
        r.time === targetReq.time
    );

    if (hasClash) {
      const clashError = new Error('Another trip has already been accepted for this time.');
      (clashError as any).status = 409;
      (clashError as any).code = 'CLASH';
      throw clashError;
    }

    targetReq.status = 'ACCEPTED';
    currentTripId = targetReq.id;
    return targetReq as unknown as T;
  }

  // 5. POST /api/trips/:tripId/boarding
  const boardingMatch = endpoint.match(/^\/trips\/([^/]+)\/boarding$/);
  if (boardingMatch && method === 'POST') {
    const tripId = boardingMatch[1];
    const targetReq = fallbackRequests.find((r) => r.id === tripId);
    if (!targetReq) throw new Error('Trip not found');

    const payload: BoardingUpdatePayload = body;
    targetReq.passengers = payload.passengers;
    targetReq.status = 'IN_PROGRESS';
    return targetReq as unknown as T;
  }

  // 6. POST /api/trips/:id/complete
  const completeMatch = endpoint.match(/^\/trips\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    const id = completeMatch[1];
    const targetReq = fallbackRequests.find((r) => r.id === id);
    if (!targetReq) throw new Error('Trip not found');

    targetReq.status = 'COMPLETED';
    targetReq.completedAt = new Date().toISOString();
    if (currentTripId === id) {
      currentTripId = null;
    }
    return {
      message: 'Trip completed. Toto is now free.',
      trip: targetReq
    } as unknown as T;
  }

  // 7. GET /api/history/person/:name
  const personHistoryMatch = endpoint.match(/^\/history\/person\/([^/]+)$/);
  if (personHistoryMatch && method === 'GET') {
    const nameParam = decodeURIComponent(personHistoryMatch[1]).toLowerCase();
    const historyItems: PersonHistoryItem[] = [];

    fallbackRequests.forEach((req) => {
      const passenger = req.passengers.find((p) => p.name.toLowerCase() === nameParam);
      if (passenger) {
        historyItems.push({
          id: req.id,
          date: req.date,
          time: req.time,
          from: req.from,
          to: req.to,
          passengerStatus: passenger.status,
          tripStatus: req.status
        });
      }
    });

    return historyItems as unknown as T;
  }

  // 8. GET /api/history/rider
  if (endpoint === '/history/rider' && method === 'GET') {
    const completedTrips = fallbackRequests.filter((r) => r.status === 'COMPLETED');
    const riderHistory: RiderHistoryItem[] = completedTrips.map((req) => {
      const boardedCount = req.passengers.filter((p) => p.status === 'BOARDED').length;
      const missedCount = req.passengers.filter((p) => p.status === 'MISSED').length;

      return {
        id: req.id,
        date: req.date,
        time: req.time,
        from: req.from,
        to: req.to,
        passengerCount: req.passengerCount,
        boardedCount,
        missedCount,
        status: req.status,
        completedAt: req.completedAt
      };
    });

    return riderHistory as unknown as T;
  }

  throw new Error(`Unhandled endpoint: ${endpoint}`);
}

export const api = {
  createRequest: (payload: CreateRideRequestPayload) =>
    request<RideRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRequests: () => request<RideRequest[]>('/requests'),

  getCurrentTrip: () => request<RideRequest | null>('/trips/current'),

  acceptRequest: (id: string) =>
    request<RideRequest>(`/requests/${id}/accept`, {
      method: 'POST',
    }),

  updateBoarding: (tripId: string, payload: BoardingUpdatePayload) =>
    request<RideRequest>(`/trips/${tripId}/boarding`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeTrip: (id: string) =>
    request<{ message: string; trip: RideRequest }>(`/trips/${id}/complete`, {
      method: 'POST',
    }),

  getPersonHistory: (name: string) =>
    request<PersonHistoryItem[]>(`/history/person/${encodeURIComponent(name)}`),

  getRiderHistory: () => request<RiderHistoryItem[]>('/history/rider'),
};
