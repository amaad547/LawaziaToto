const express = require('express');
const { getDatabase } = require('../db');

const router = express.Router();

// Helper: Normalize ISO string or date
function normalizeScheduledAt(scheduledAt, scheduledDate, scheduledTime) {
  if (scheduledAt && typeof scheduledAt === 'string' && scheduledAt.trim() !== '') {
    const d = new Date(scheduledAt.trim());
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  if (scheduledDate && scheduledTime) {
    const combined = `${scheduledDate.trim()} ${scheduledTime.trim()}`;
    const d = new Date(combined);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  return null;
}

// Helper: Format a request row with people
function formatRequest(row, people = []) {
  return {
    id: row.id,
    from: row.from_location,
    to: row.to_location,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
    people: people.map(p => ({
      id: p.id,
      requestId: p.request_id || row.id,
      name: p.name
    }))
  };
}

// POST /api/requests - Create a ride request
router.post('/', (req, res) => {
  const db = getDatabase();
  const { from, to, scheduledAt, scheduledDate, scheduledTime, numberOfPeople, people } = req.body;

  // Validation: Origin and Destination
  if (!from || typeof from !== 'string' || from.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'From location is required.'
    });
  }

  if (!to || typeof to !== 'string' || to.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'To location is required.'
    });
  }

  // Validation: Scheduled Date/Time
  const normalizedTime = normalizeScheduledAt(scheduledAt, scheduledDate, scheduledTime);
  if (!normalizedTime) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'A valid scheduled date and time is required.'
    });
  }

  // Validation: People
  if (!people || !Array.isArray(people) || people.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'At least one passenger is required.'
    });
  }

  const parsedNames = [];
  for (let i = 0; i < people.length; i++) {
    const item = people[i];
    let name = '';
    if (typeof item === 'string') {
      name = item.trim();
    } else if (item && typeof item === 'object' && typeof item.name === 'string') {
      name = item.name.trim();
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Passenger name at position ${i + 1} cannot be empty.`
      });
    }
    parsedNames.push(name);
  }

  // Validation: Optional numberOfPeople count check
  if (numberOfPeople !== undefined && numberOfPeople !== null) {
    const count = parseInt(numberOfPeople, 10);
    if (isNaN(count) || count !== parsedNames.length) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Number of people does not match passenger names count.'
      });
    }
  }

  try {
    db.exec('BEGIN IMMEDIATE');

    const insertReq = db.prepare(`
      INSERT INTO requests (from_location, to_location, scheduled_at, status)
      VALUES (?, ?, ?, 'REQUESTED')
    `);
    const reqResult = insertReq.run(from.trim(), to.trim(), normalizedTime);
    const requestId = Number(reqResult.lastInsertRowid);

    const insertPerson = db.prepare(`
      INSERT INTO request_people (request_id, name)
      VALUES (?, ?)
    `);

    const insertedPeople = [];
    for (const name of parsedNames) {
      const pResult = insertPerson.run(requestId, name);
      insertedPeople.push({
        id: Number(pResult.lastInsertRowid),
        requestId,
        name
      });
    }

    db.exec('COMMIT');

    const createdReq = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);

    return res.status(201).json({
      success: true,
      request: formatRequest(createdReq, insertedPeople)
    });
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to create ride request.'
    });
  }
});

// GET /api/requests - List requests
router.get('/', (req, res) => {
  const db = getDatabase();
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM requests';
    const params = [];

    if (status && typeof status === 'string') {
      query += ' WHERE status = ?';
      params.push(status.toUpperCase().trim());
    }

    query += ' ORDER BY scheduled_at ASC, id ASC';

    const requests = db.prepare(query).all(...params);

    const peopleStmt = db.prepare('SELECT id, request_id, name FROM request_people WHERE request_id = ?');

    const results = requests.map(reqRow => {
      const people = peopleStmt.all(reqRow.id);
      return formatRequest(reqRow, people);
    });

    return res.json({
      success: true,
      requests: results
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve requests.'
    });
  }
});

// GET /api/requests/:id - Single request details
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const requestId = parseInt(req.params.id, 10);

  if (isNaN(requestId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid request ID.'
    });
  }

  try {
    const requestRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (!requestRow) {
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: `Ride request #${requestId} not found.`
      });
    }

    const people = db.prepare('SELECT id, request_id, name FROM request_people WHERE request_id = ?').all(requestId);

    return res.json({
      success: true,
      request: formatRequest(requestRow, people)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve request.'
    });
  }
});

// POST /api/requests/:id/accept - Accept a ride request
router.post('/:id/accept', (req, res) => {
  const db = getDatabase();
  const requestId = parseInt(req.params.id, 10);

  if (isNaN(requestId)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid request ID.'
    });
  }

  try {
    db.exec('BEGIN IMMEDIATE');

    const requestRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (!requestRow) {
      db.exec('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'REQUEST_NOT_FOUND',
        message: `Ride request #${requestId} not found.`
      });
    }

    if (requestRow.status === 'ACCEPTED') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Request is already accepted.'
      });
    }

    if (requestRow.status === 'COMPLETED') {
      db.exec('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'ALREADY_COMPLETED',
        message: 'Cannot accept an already completed request.'
      });
    }

    // Clash Detection: check if any accepted or in-progress trip overlaps the scheduled time
    const clash = db.prepare(`
      SELECT id FROM trips 
      WHERE scheduled_at = ? AND status IN ('ACCEPTED', 'IN_PROGRESS')
    `).get(requestRow.scheduled_at);

    if (clash) {
      // Mark this request as CLASH
      db.prepare("UPDATE requests SET status = 'CLASH' WHERE id = ?").run(requestId);
      db.exec('COMMIT');
      return res.status(409).json({
        success: false,
        error: 'CLASH',
        message: 'The Toto is already reserved for this time.'
      });
    }

    // Create the trip
    const insertTrip = db.prepare(`
      INSERT INTO trips (request_id, from_location, to_location, scheduled_at, status)
      VALUES (?, ?, ?, ?, 'ACCEPTED')
    `);
    const tripResult = insertTrip.run(
      requestId,
      requestRow.from_location,
      requestRow.to_location,
      requestRow.scheduled_at
    );
    const tripId = Number(tripResult.lastInsertRowid);

    // Copy request people into boarding records
    const people = db.prepare('SELECT id, name FROM request_people WHERE request_id = ?').all(requestId);
    const insertBoarding = db.prepare(`
      INSERT INTO boarding_records (trip_id, person_id, name, status)
      VALUES (?, ?, ?, 'PENDING')
    `);
    for (const p of people) {
      insertBoarding.run(tripId, p.id, p.name);
    }

    // Update request status to ACCEPTED
    db.prepare("UPDATE requests SET status = 'ACCEPTED' WHERE id = ?").run(requestId);

    db.exec('COMMIT');

    const createdTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    const passengers = db.prepare('SELECT * FROM boarding_records WHERE trip_id = ?').all(tripId);

    return res.status(200).json({
      success: true,
      trip: {
        id: createdTrip.id,
        requestId: createdTrip.request_id,
        from: createdTrip.from_location,
        to: createdTrip.to_location,
        scheduledAt: createdTrip.scheduled_at,
        status: createdTrip.status,
        acceptedAt: createdTrip.accepted_at,
        completedAt: createdTrip.completed_at,
        passengers: passengers.map(p => ({
          id: p.id,
          tripId: p.trip_id,
          personId: p.person_id,
          name: p.name,
          status: p.status
        }))
      }
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      try {
        db.prepare("UPDATE requests SET status = 'CLASH' WHERE id = ?").run(requestId);
        db.exec('COMMIT');
      } catch (_) {}
      return res.status(409).json({
        success: false,
        error: 'CLASH',
        message: 'The Toto is already reserved for this time.'
      });
    }

    try { db.exec('ROLLBACK'); } catch (_) {}
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to accept ride request.'
    });
  }
});

module.exports = router;
