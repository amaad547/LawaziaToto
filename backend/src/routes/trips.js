const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

function formatTrip(tripRow, passengers = []) {
  const d = new Date(tripRow.scheduled_at);
  const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
  const timeStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[1].slice(0, 5) : '';

  return {
    id: tripRow.id,
    requestId: tripRow.request_id,
    from: tripRow.from_location,
    to: tripRow.to_location,
    scheduledAt: tripRow.scheduled_at,
    date: dateStr,
    time: timeStr,
    passengerCount: passengers.length,
    status: tripRow.status,
    acceptedAt: tripRow.accepted_at,
    completedAt: tripRow.completed_at,
    passengers: passengers.map(p => ({
      id: p.id,
      tripId: p.trip_id,
      personId: p.person_id,
      name: p.name,
      status: p.status
    })),
    people: passengers.map(p => ({
      id: p.person_id || p.id,
      name: p.name
    }))
  };
}

// GET /api/trips/current - Get currently active trip
router.get('/current', (req, res) => {
  const db = getDatabase();

  try {
    // 1. Look for in-progress trip first
    let activeTrip = db.prepare(`
      SELECT * FROM trips WHERE status = 'IN_PROGRESS' ORDER BY id ASC LIMIT 1
    `).get();

    // 2. Look for earliest accepted trip
    if (!activeTrip) {
      activeTrip = db.prepare(`
        SELECT * FROM trips WHERE status = 'ACCEPTED' ORDER BY scheduled_at ASC, id ASC LIMIT 1
      `).get();
    }

    if (!activeTrip) {
      return res.json({
        success: true,
        trip: null
      });
    }

    const passengers = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? ORDER BY id ASC').all(activeTrip.id);

    return res.json({
      success: true,
      trip: formatTrip(activeTrip, passengers)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve current trip.'
    });
  }
});

// GET /api/trips/:id - Get trip details
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const tripId = parseInt(req.params.id, 10);

  if (isNaN(tripId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid trip ID.'
    });
  }

  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'TRIP_NOT_FOUND',
        message: `Trip #${tripId} not found.`
      });
    }

    const passengers = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? ORDER BY id ASC').all(tripId);

    return res.json({
      success: true,
      trip: formatTrip(trip, passengers)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve trip.'
    });
  }
});

// POST /api/trips/:id/start - Start pickup (ACCEPTED -> IN_PROGRESS)
router.post('/:id/start', (req, res) => {
  const db = getDatabase();
  const tripId = parseInt(req.params.id, 10);

  if (isNaN(tripId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid trip ID.'
    });
  }

  try {
    db.exec('BEGIN IMMEDIATE');

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      db.exec('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'TRIP_NOT_FOUND',
        message: `Trip #${tripId} not found.`
      });
    }

    if (trip.status === 'COMPLETED') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'ALREADY_COMPLETED',
        message: 'Trip is already completed.'
      });
    }

    if (trip.status === 'IN_PROGRESS') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Trip is already in progress.'
      });
    }

    if (trip.status !== 'ACCEPTED') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `Cannot start trip with status '${trip.status}'.`
      });
    }

    // Invariant: The single Toto cannot have two trips simultaneously IN_PROGRESS
    const anotherInProgress = db.prepare(`
      SELECT id FROM trips WHERE status = 'IN_PROGRESS' AND id != ?
    `).get(tripId);

    if (anotherInProgress) {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `Another trip (#${anotherInProgress.id}) is currently in progress. Complete it first.`
      });
    }

    db.prepare("UPDATE trips SET status = 'IN_PROGRESS' WHERE id = ?").run(tripId);
    db.exec('COMMIT');

    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    const passengers = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? ORDER BY id ASC').all(tripId);

    return res.json({
      success: true,
      trip: formatTrip(updatedTrip, passengers)
    });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to start trip.'
    });
  }
});

// POST /api/trips/:tripId/boarding - Record passenger boarding status
router.post('/:tripId/boarding', (req, res) => {
  const db = getDatabase();
  const tripId = parseInt(req.params.tripId, 10);

  if (isNaN(tripId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid trip ID.'
    });
  }

  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'TRIP_NOT_FOUND',
        message: `Trip #${tripId} not found.`
      });
    }

    if (trip.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'ALREADY_COMPLETED',
        message: 'Cannot update boarding for an already completed trip.'
      });
    }

    // CASE 1: Batch boarding submission (from frontend/API contract)
    if (Array.isArray(req.body.passengers)) {
      const passengersList = req.body.passengers;
      if (passengersList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Passengers array cannot be empty.'
        });
      }

      // Pre-validate all items
      for (const p of passengersList) {
        if (!p.status || typeof p.status !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Each passenger must have a status.'
          });
        }
        const st = p.status.trim().toUpperCase();
        if (st !== 'BOARDED' && st !== 'MISSED' && st !== 'PENDING') {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: "Status must be 'BOARDED' or 'MISSED'."
          });
        }
      }

      db.exec('BEGIN IMMEDIATE');

      for (const p of passengersList) {
        const normStatus = p.status.trim().toUpperCase();
        let targetId = null;

        if (p.id) {
          const rec = db.prepare('SELECT id FROM boarding_records WHERE id = ? AND trip_id = ?').get(p.id, tripId);
          if (rec) targetId = rec.id;
        }
        if (!targetId && p.personId) {
          const rec = db.prepare('SELECT id FROM boarding_records WHERE person_id = ? AND trip_id = ?').get(p.personId, tripId);
          if (rec) targetId = rec.id;
        }
        if (!targetId && p.name) {
          const rec = db.prepare('SELECT id FROM boarding_records WHERE trip_id = ? AND LOWER(name) = LOWER(?)').get(tripId, p.name.trim());
          if (rec) targetId = rec.id;
        }

        if (targetId) {
          db.prepare(`
            UPDATE boarding_records
            SET status = ?, updated_at = datetime('now')
            WHERE id = ?
          `).run(normStatus, targetId);
        }
      }

      db.exec('COMMIT');

      const updatedRecords = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? ORDER BY id ASC').all(tripId);

      return res.json({
        success: true,
        id: trip.id,
        status: trip.status,
        passengers: updatedRecords.map(p => ({
          id: p.id,
          tripId: p.trip_id,
          personId: p.person_id,
          name: p.name,
          status: p.status
        }))
      });
    }

    // CASE 2: Single passenger boarding update
    const { personId, passengerId, name, status } = req.body;

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Boarding status is required.'
      });
    }

    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus !== 'BOARDED' && normalizedStatus !== 'MISSED') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: "Status must be 'BOARDED' or 'MISSED'."
      });
    }

    // Locate the passenger boarding record
    let record = null;
    const targetPersonId = personId !== undefined ? parseInt(personId, 10) : undefined;
    const targetPassengerId = passengerId !== undefined ? parseInt(passengerId, 10) : undefined;

    if (!isNaN(targetPassengerId)) {
      record = db.prepare('SELECT * FROM boarding_records WHERE id = ? AND trip_id = ?').get(targetPassengerId, tripId);
    }
    if (!record && !isNaN(targetPersonId)) {
      record = db.prepare('SELECT * FROM boarding_records WHERE person_id = ? AND trip_id = ?').get(targetPersonId, tripId);
    }
    if (!record && name && typeof name === 'string') {
      record = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? AND LOWER(name) = LOWER(?)').get(tripId, name.trim());
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'BOARDING_NOT_FOUND',
        message: 'Passenger does not belong to this trip.'
      });
    }

    db.prepare(`
      UPDATE boarding_records
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(normalizedStatus, record.id);

    return res.json({
      success: true,
      boardingRecord: {
        id: record.id,
        tripId,
        personId: record.person_id,
        name: record.name,
        status: normalizedStatus
      }
    });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to record boarding status.'
    });
  }
});

// POST /api/trips/:id/complete - Complete the trip
router.post('/:id/complete', (req, res) => {
  const db = getDatabase();
  const tripId = parseInt(req.params.id, 10);

  if (isNaN(tripId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid trip ID.'
    });
  }

  try {
    db.exec('BEGIN IMMEDIATE');

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      db.exec('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'TRIP_NOT_FOUND',
        message: `Trip #${tripId} not found.`
      });
    }

    if (trip.status === 'COMPLETED') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'ALREADY_COMPLETED',
        message: 'Trip is already completed.'
      });
    }

    if (trip.status !== 'IN_PROGRESS') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Trip must be in progress before it can be completed.'
      });
    }

    // Verify all boarding records are either BOARDED or MISSED
    const boardingRecords = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ?').all(tripId);
    const pendingBoarding = boardingRecords.filter(r => r.status === 'PENDING');

    if (pendingBoarding.length > 0) {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `All passengers must have a boarding status (BOARDED or MISSED) before completing the trip. Remaining pending: ${pendingBoarding.map(p => p.name).join(', ')}.`
      });
    }

    // Transition trip and request to COMPLETED
    db.prepare("UPDATE trips SET status = 'COMPLETED', completed_at = datetime('now') WHERE id = ?").run(tripId);
    db.prepare("UPDATE requests SET status = 'COMPLETED' WHERE id = ?").run(trip.request_id);

    db.exec('COMMIT');

    const completedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    const passengers = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ? ORDER BY id ASC').all(tripId);

    return res.json({
      success: true,
      trip: formatTrip(completedTrip, passengers)
    });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to complete trip.'
    });
  }
});

module.exports = router;
