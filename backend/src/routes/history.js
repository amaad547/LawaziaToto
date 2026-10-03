const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// GET /api/history/person/:name - Get all trips containing a person's name
router.get('/person/:name', (req, res) => {
  const db = getDatabase();
  const name = req.params.name;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Person name is required.'
    });
  }

  const trimmedName = name.trim();

  try {
    const query = `
      SELECT 
        t.id AS tripId,
        t.request_id AS requestId,
        t.from_location AS fromLocation,
        t.to_location AS toLocation,
        t.scheduled_at AS scheduledAt,
        t.status AS tripStatus,
        t.accepted_at AS acceptedAt,
        t.completed_at AS completedAt,
        b.status AS boardingStatus
      FROM boarding_records b
      JOIN trips t ON b.trip_id = t.id
      WHERE LOWER(b.name) = LOWER(?)
      ORDER BY t.scheduled_at DESC, t.id DESC
    `;

    const rows = db.prepare(query).all(trimmedName);

    const history = rows.map(r => ({
      tripId: r.tripId,
      requestId: r.requestId,
      from: r.fromLocation,
      to: r.toLocation,
      route: `${r.fromLocation} → ${r.toLocation}`,
      scheduledAt: r.scheduledAt,
      tripStatus: r.tripStatus,
      boardingStatus: r.boardingStatus,
      acceptedAt: r.acceptedAt,
      completedAt: r.completedAt
    }));

    return res.json({
      success: true,
      person: trimmedName,
      history
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve person history.'
    });
  }
});

// GET /api/history/rider - Get all trips operated by the Toto
router.get('/rider', (req, res) => {
  const db = getDatabase();

  try {
    const trips = db.prepare(`
      SELECT * FROM trips ORDER BY scheduled_at DESC, id DESC
    `).all();

    const passengersStmt = db.prepare(`
      SELECT name, status FROM boarding_records WHERE trip_id = ? ORDER BY id ASC
    `);

    const history = trips.map(t => {
      const passengers = passengersStmt.all(t.id);
      const requested = passengers.length;
      const boarded = passengers.filter(p => p.status === 'BOARDED').length;
      const missed = passengers.filter(p => p.status === 'MISSED').length;

      return {
        tripId: t.id,
        requestId: t.request_id,
        from: t.from_location,
        to: t.to_location,
        route: `${t.from_location} → ${t.to_location}`,
        scheduledAt: t.scheduled_at,
        status: t.status,
        acceptedAt: t.accepted_at,
        completedAt: t.completed_at,
        passengers: passengers.map(p => ({
          name: p.name,
          status: p.status
        })),
        summary: {
          requested,
          boarded,
          missed
        }
      };
    });

    return res.json({
      success: true,
      history
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve rider history.'
    });
  }
});

module.exports = router;
