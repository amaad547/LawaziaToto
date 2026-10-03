const express = require('express');
const { getDatabase } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Protect all admin routes
router.use(requireAuth, requireRole('ADMIN'));

// GET /api/admin/overview - System Statistics Overview
router.get('/overview', (req, res) => {
  const db = getDatabase();

  try {
    const totalUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'USER'").get().count;
    const totalRiders = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'RIDER'").get().count;
    const totalAdmins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN'").get().count;

    const totalRequests = db.prepare('SELECT COUNT(*) AS count FROM requests').get().count;
    const pendingRequests = db.prepare("SELECT COUNT(*) AS count FROM requests WHERE status = 'REQUESTED'").get().count;
    const clashRequests = db.prepare("SELECT COUNT(*) AS count FROM requests WHERE status = 'CLASH'").get().count;

    const totalTrips = db.prepare('SELECT COUNT(*) AS count FROM trips').get().count;
    const activeTrips = db.prepare("SELECT COUNT(*) AS count FROM trips WHERE status IN ('ACCEPTED', 'IN_PROGRESS')").get().count;
    const completedTrips = db.prepare("SELECT COUNT(*) AS count FROM trips WHERE status = 'COMPLETED'").get().count;

    const totalBoarded = db.prepare("SELECT COUNT(*) AS count FROM boarding_records WHERE status = 'BOARDED'").get().count;
    const totalMissed = db.prepare("SELECT COUNT(*) AS count FROM boarding_records WHERE status = 'MISSED'").get().count;

    return res.json({
      success: true,
      stats: {
        users: {
          totalUsers,
          totalRiders,
          totalAdmins,
          totalAccounts: totalUsers + totalRiders + totalAdmins
        },
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          clashes: clashRequests
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
          completed: completedTrips
        },
        passengers: {
          boarded: totalBoarded,
          missed: totalMissed,
          totalTracked: totalBoarded + totalMissed
        }
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve admin overview statistics.'
    });
  }
});

// GET /api/admin/users - All registered accounts
router.get('/users', (req, res) => {
  const db = getDatabase();

  try {
    const users = db.prepare(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    return res.json({
      success: true,
      users
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve users.'
    });
  }
});

// GET /api/admin/requests - System-wide requests
router.get('/requests', (req, res) => {
  const db = getDatabase();

  try {
    const requests = db.prepare(`
      SELECT r.*, u.name AS user_name, u.email AS user_email
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.scheduled_at DESC, r.id DESC
    `).all();

    const peopleStmt = db.prepare('SELECT id, request_id, name FROM request_people WHERE request_id = ?');

    const formatted = requests.map(r => ({
      id: r.id,
      from: r.from_location,
      to: r.to_location,
      scheduledAt: r.scheduled_at,
      status: r.status,
      createdAt: r.created_at,
      userId: r.user_id,
      user: r.user_id ? { id: r.user_id, name: r.user_name, email: r.user_email } : null,
      passengers: peopleStmt.all(r.id).map(p => ({
        id: p.id,
        name: p.name
      }))
    }));

    return res.json({
      success: true,
      requests: formatted
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve requests.'
    });
  }
});

// GET /api/admin/trips - System-wide trips with boarding details
router.get('/trips', (req, res) => {
  const db = getDatabase();

  try {
    const trips = db.prepare(`
      SELECT * FROM trips ORDER BY scheduled_at DESC, id DESC
    `).all();

    const boardingStmt = db.prepare(`
      SELECT id, person_id, name, status, updated_at
      FROM boarding_records
      WHERE trip_id = ?
      ORDER BY id ASC
    `);

    const formatted = trips.map(t => {
      const passengers = boardingStmt.all(t.id);
      return {
        id: t.id,
        requestId: t.request_id,
        from: t.from_location,
        to: t.to_location,
        scheduledAt: t.scheduled_at,
        status: t.status,
        acceptedAt: t.accepted_at,
        completedAt: t.completed_at,
        passengers: passengers.map(p => ({
          id: p.id,
          personId: p.person_id,
          name: p.name,
          status: p.status,
          updatedAt: p.updated_at
        })),
        summary: {
          total: passengers.length,
          boarded: passengers.filter(p => p.status === 'BOARDED').length,
          missed: passengers.filter(p => p.status === 'MISSED').length,
          pending: passengers.filter(p => p.status === 'PENDING').length
        }
      };
    });

    return res.json({
      success: true,
      trips: formatted
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve trips.'
    });
  }
});

module.exports = router;
