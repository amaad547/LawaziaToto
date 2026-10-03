# Lawazia Toto Desk — API Contract Documentation

Base URL: `/api` (or environment variable `VITE_API_BASE_URL` with default `/api`)

---

## 1. Create Ride Request

- **Endpoint**: `POST /api/requests`
- **Request Body**:
```json
{
  "from": "College",
  "to": "Station",
  "date": "2026-10-03",
  "time": "10:30",
  "passengerCount": 3,
  "passengers": ["Rahul", "Aman", "Priya"]
}
```
- **Response** (`201 Created` or `200 OK`):
```json
{
  "id": "104",
  "from": "College",
  "to": "Station",
  "date": "2026-10-03",
  "time": "10:30",
  "passengerCount": 3,
  "passengers": [
    { "name": "Rahul", "status": "PENDING" },
    { "name": "Aman", "status": "PENDING" },
    { "name": "Priya", "status": "PENDING" }
  ],
  "status": "REQUESTED",
  "createdAt": "2026-10-03T10:00:00.000Z"
}
```

---

## 2. Get All Requests (Rider Dashboard)

- **Endpoint**: `GET /api/requests`
- **Response** (`200 OK`):
```json
[
  {
    "id": "104",
    "from": "College",
    "to": "Station",
    "date": "2026-10-03",
    "time": "10:30",
    "passengerCount": 3,
    "passengers": [
      { "name": "Rahul", "status": "PENDING" },
      { "name": "Aman", "status": "PENDING" },
      { "name": "Priya", "status": "PENDING" }
    ],
    "status": "REQUESTED",
    "createdAt": "2026-10-03T10:00:00.000Z"
  }
]
```

---

## 3. Get Current Active Trip

- **Endpoint**: `GET /api/trips/current`
- **Response** (`200 OK`):
Returns the current active trip object or `null` / `{ "trip": null }` if no trip is currently active.
```json
{
  "id": "104",
  "from": "College",
  "to": "Station",
  "date": "2026-10-03",
  "time": "10:30",
  "passengerCount": 3,
  "passengers": [
    { "name": "Rahul", "status": "BOARDED" },
    { "name": "Aman", "status": "BOARDED" },
    { "name": "Priya", "status": "MISSED" }
  ],
  "status": "IN_PROGRESS",
  "createdAt": "2026-10-03T10:00:00.000Z"
}
```

---

## 4. Accept Request

- **Endpoint**: `POST /api/requests/:id/accept`
- **Response Success** (`200 OK`):
```json
{
  "id": "104",
  "from": "College",
  "to": "Station",
  "date": "2026-10-03",
  "time": "10:30",
  "passengerCount": 3,
  "passengers": [
    { "name": "Rahul", "status": "PENDING" },
    { "name": "Aman", "status": "PENDING" },
    { "name": "Priya", "status": "PENDING" }
  ],
  "status": "ACCEPTED"
}
```
- **Response Clash** (`409 Conflict`):
```json
{
  "error": "CLASH",
  "message": "Another trip has already been accepted for this time."
}
```

---

## 5. Submit Passenger Boarding Statuses

- **Endpoint**: `POST /api/trips/:tripId/boarding`
- **Request Body**:
```json
{
  "passengers": [
    { "name": "Rahul", "status": "BOARDED" },
    { "name": "Aman", "status": "BOARDED" },
    { "name": "Priya", "status": "MISSED" }
  ]
}
```
- **Response** (`200 OK`):
```json
{
  "id": "104",
  "passengers": [
    { "name": "Rahul", "status": "BOARDED" },
    { "name": "Aman", "status": "BOARDED" },
    { "name": "Priya", "status": "MISSED" }
  ],
  "status": "IN_PROGRESS"
}
```

---

## 6. Complete Trip

- **Endpoint**: `POST /api/trips/:id/complete`
- **Response** (`200 OK`):
```json
{
  "message": "Trip completed. Toto is now free.",
  "trip": {
    "id": "104",
    "status": "COMPLETED",
    "completedAt": "2026-10-03T11:00:00.000Z"
  }
}
```

---

## 7. Get Person History

- **Endpoint**: `GET /api/history/person/:name`
- **Response** (`200 OK`):
```json
[
  {
    "id": "104",
    "date": "2026-10-03",
    "time": "10:30",
    "from": "College",
    "to": "Station",
    "passengerStatus": "BOARDED",
    "tripStatus": "COMPLETED"
  },
  {
    "id": "101",
    "date": "2026-10-01",
    "time": "15:00",
    "from": "Station",
    "to": "College",
    "passengerStatus": "MISSED",
    "tripStatus": "COMPLETED"
  }
]
```

---

## 8. Get Rider History

- **Endpoint**: `GET /api/history/rider`
- **Response** (`200 OK`):
```json
[
  {
    "id": "104",
    "date": "2026-10-03",
    "time": "10:30",
    "from": "College",
    "to": "Station",
    "passengerCount": 3,
    "boardedCount": 2,
    "missedCount": 1,
    "status": "COMPLETED",
    "completedAt": "2026-10-03T11:00:00.000Z"
  }
]
```
