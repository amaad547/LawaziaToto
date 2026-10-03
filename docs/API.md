# Lawazia Toto Desk — API Documentation

Base URL: `/api` (or `http://localhost:5000/api`)

All JSON responses have standard formats.

---

## Standard Responses

### Success Response
```json
{
  "success": true,
  ...
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable explanation"
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (400)
- `REQUEST_NOT_FOUND` (404)
- `TRIP_NOT_FOUND` (404)
- `BOARDING_NOT_FOUND` (404)
- `CLASH` (409)
- `INVALID_STATUS` (400)
- `ALREADY_COMPLETED` (400)
- `SERVER_ERROR` (500)

---

## 1. Ride Requests

### 1.1 Create Request
- **Endpoint**: `POST /api/requests`
- **Description**: Submit a new ride request for one or multiple passengers.
- **Request Body**:
```json
{
  "from": "College",
  "to": "Station",
  "scheduledAt": "2026-10-03T10:00:00.000Z",
  "people": [
    { "name": "Rahul" },
    { "name": "Aman" },
    { "name": "Priya" }
  ]
}
```
*Note*: `people` can also be an array of strings `["Rahul", "Aman", "Priya"]` or an array of objects `[{"name": "Rahul"}]`. Both formats are supported and normalized.

- **Success Response (201 Created)**:
```json
{
  "success": true,
  "request": {
    "id": 1,
    "from": "College",
    "to": "Station",
    "scheduledAt": "2026-10-03T10:00:00.000Z",
    "status": "REQUESTED",
    "createdAt": "2026-10-03T09:00:00.000Z",
    "people": [
      { "id": 1, "requestId": 1, "name": "Rahul" },
      { "id": 2, "requestId": 1, "name": "Aman" },
      { "id": 3, "requestId": 1, "name": "Priya" }
    ]
  }
}
```

### 1.2 Get All Requests
- **Endpoint**: `GET /api/requests`
- **Query Params**:
  - `status` (optional): Filter by request status (e.g. `REQUESTED`, `ACCEPTED`, `CLASH`).
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "requests": [
    {
      "id": 1,
      "from": "College",
      "to": "Station",
      "scheduledAt": "2026-10-03T10:00:00.000Z",
      "status": "REQUESTED",
      "createdAt": "2026-10-03T09:00:00.000Z",
      "people": [
        { "id": 1, "name": "Rahul" },
        { "id": 2, "name": "Aman" },
        { "id": 3, "name": "Priya" }
      ]
    }
  ]
}
```

### 1.3 Get Single Request
- **Endpoint**: `GET /api/requests/:id`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "request": {
    "id": 1,
    "from": "College",
    "to": "Station",
    "scheduledAt": "2026-10-03T10:00:00.000Z",
    "status": "REQUESTED",
    "createdAt": "2026-10-03T09:00:00.000Z",
    "people": [
      { "id": 1, "name": "Rahul" },
      { "id": 2, "name": "Aman" },
      { "id": 3, "name": "Priya" }
    ]
  }
}
```

---

## 2. Trip Management & Lifecycle

### 2.1 Accept Request
- **Endpoint**: `POST /api/requests/:id/accept`
- **Description**: Accept a pending ride request. Checks whether the Toto is already reserved for the scheduled time. If conflicting, returns HTTP 409 and marks request as `CLASH`.
- **Success Response (200 OK or 201 Created)**:
```json
{
  "success": true,
  "trip": {
    "id": 1,
    "requestId": 1,
    "from": "College",
    "to": "Station",
    "scheduledAt": "2026-10-03T10:00:00.000Z",
    "status": "ACCEPTED",
    "acceptedAt": "2026-10-03T09:05:00.000Z",
    "completedAt": null,
    "passengers": [
      { "id": 1, "tripId": 1, "personId": 1, "name": "Rahul", "status": "PENDING" },
      { "id": 2, "tripId": 1, "personId": 2, "name": "Aman", "status": "PENDING" },
      { "id": 3, "tripId": 1, "personId": 3, "name": "Priya", "status": "PENDING" }
    ]
  }
}
```
- **Conflict Response (409 Conflict)**:
```json
{
  "success": false,
  "error": "CLASH",
  "message": "The Toto is already reserved for this time."
}
```

### 2.2 Get Current Active Trip
- **Endpoint**: `GET /api/trips/current`
- **Description**: Returns the active trip (`ACCEPTED` or `IN_PROGRESS`). If none exists, returns `trip: null`.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "trip": {
    "id": 1,
    "requestId": 1,
    "from": "College",
    "to": "Station",
    "scheduledAt": "2026-10-03T10:00:00.000Z",
    "status": "IN_PROGRESS",
    "acceptedAt": "2026-10-03T09:05:00.000Z",
    "completedAt": null,
    "passengers": [
      { "id": 1, "tripId": 1, "personId": 1, "name": "Rahul", "status": "BOARDED" },
      { "id": 2, "tripId": 1, "personId": 2, "name": "Aman", "status": "BOARDED" },
      { "id": 3, "tripId": 1, "personId": 3, "name": "Priya", "status": "MISSED" }
    ]
  }
}
```

### 2.3 Start Pickup
- **Endpoint**: `POST /api/trips/:id/start`
- **Description**: Transitions trip status from `ACCEPTED` to `IN_PROGRESS`.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "trip": {
    "id": 1,
    "status": "IN_PROGRESS",
    ...
  }
}
```

### 2.4 Record Passenger Boarding Status
- **Endpoint**: `POST /api/trips/:tripId/boarding`
- **Description**: Mark a passenger as `BOARDED` or `MISSED`.
- **Request Body**:
```json
{
  "personId": 1,
  "status": "BOARDED"
}
```
*(Also accepts `{ "name": "Rahul", "status": "BOARDED" }` or `{ "passengerId": 1, "status": "BOARDED" }` for convenience)*
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "boardingRecord": {
    "id": 1,
    "tripId": 1,
    "personId": 1,
    "name": "Rahul",
    "status": "BOARDED"
  }
}
```

### 2.5 Complete Trip
- **Endpoint**: `POST /api/trips/:id/complete`
- **Description**: Transitions trip status from `IN_PROGRESS` to `COMPLETED`. All passengers must have a boarding status (`BOARDED` or `MISSED`) recorded.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "trip": {
    "id": 1,
    "status": "COMPLETED",
    "completedAt": "2026-10-03T10:45:00.000Z",
    ...
  }
}
```

---

## 3. History Endpoints

### 3.1 Person Trip History
- **Endpoint**: `GET /api/history/person/:name`
- **Description**: Returns all trips containing the given person's name, along with their boarding status.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "person": "Rahul",
  "history": [
    {
      "tripId": 1,
      "requestId": 1,
      "from": "College",
      "to": "Station",
      "scheduledAt": "2026-10-03T10:00:00.000Z",
      "tripStatus": "COMPLETED",
      "boardingStatus": "BOARDED",
      "completedAt": "2026-10-03T10:45:00.000Z"
    }
  ]
}
```

### 3.2 Rider Trip History
- **Endpoint**: `GET /api/history/rider`
- **Description**: Returns every trip operated by the Toto/rider.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "history": [
    {
      "tripId": 1,
      "requestId": 1,
      "from": "College",
      "to": "Station",
      "route": "College → Station",
      "scheduledAt": "2026-10-03T10:00:00.000Z",
      "status": "COMPLETED",
      "acceptedAt": "2026-10-03T09:05:00.000Z",
      "completedAt": "2026-10-03T10:45:00.000Z",
      "passengers": [
        { "name": "Rahul", "status": "BOARDED" },
        { "name": "Aman", "status": "BOARDED" },
        { "name": "Priya", "status": "MISSED" }
      ],
      "summary": {
        "requested": 3,
        "boarded": 2,
        "missed": 1
      }
    }
  ]
}
```

---

## 4. Health Check
- **Endpoint**: `GET /api/health`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-10-03T11:20:00.000Z"
}
```
