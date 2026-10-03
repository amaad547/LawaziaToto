const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Set test db
const testDbFile = path.join(__dirname, 'test_phase2.db');
process.env.DATABASE_FILE = testDbFile;

const { getDatabase, closeDatabase } = require('../src/db');
const app = require('../src/app');

async function request(app, method, url, body = null) {
  return new Promise((resolve, reject) => {
    const http = require('node:http');
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          server.close();
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, text: data });
          }
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe('Phase 2 - Trip Management, Clash Prevention & Boarding', () => {
  before(() => {
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
    getDatabase(testDbFile);
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  });

  let reqAId, reqBId, tripId;

  test('Initial current trip is null', async () => {
    const res = await request(app, 'GET', '/api/trips/current');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip, null);
  });

  test('Create Request A (10:00) with 3 passengers: Rahul, Aman, Priya', async () => {
    const res = await request(app, 'POST', '/api/requests', {
      from: 'College',
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [{ name: 'Rahul' }, { name: 'Aman' }, { name: 'Priya' }]
    });
    assert.strictEqual(res.status, 201);
    reqAId = res.body.request.id;
    assert.ok(reqAId);
  });

  test('Create Request B (10:00) same time', async () => {
    const res = await request(app, 'POST', '/api/requests', {
      from: 'Station',
      to: 'Office',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [{ name: 'Vikram' }]
    });
    assert.strictEqual(res.status, 201);
    reqBId = res.body.request.id;
    assert.ok(reqBId);
  });

  test('Accept Request A -> becomes ACCEPTED trip', async () => {
    const res = await request(app, 'POST', `/api/requests/${reqAId}/accept`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip.status, 'ACCEPTED');
    assert.strictEqual(res.body.trip.passengers.length, 3);
    assert.strictEqual(res.body.trip.passengers[0].status, 'PENDING');
    tripId = res.body.trip.id;
  });

  test('Accept Request B (same time) -> 409 Conflict with CLASH', async () => {
    const res = await request(app, 'POST', `/api/requests/${reqBId}/accept`);
    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'CLASH');
    assert.strictEqual(res.body.message, 'The Toto is already reserved for this time.');

    // Verify request B status in DB is updated to CLASH
    const checkB = await request(app, 'GET', `/api/requests/${reqBId}`);
    assert.strictEqual(checkB.body.request.status, 'CLASH');
  });

  test('Duplicate accept on Request A is rejected', async () => {
    const res = await request(app, 'POST', `/api/requests/${reqAId}/accept`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'INVALID_STATUS');
  });

  test('Current trip returns accepted trip', async () => {
    const res = await request(app, 'GET', '/api/trips/current');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip.id, tripId);
    assert.strictEqual(res.body.trip.status, 'ACCEPTED');
  });

  test('Cannot complete trip when in ACCEPTED state', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/complete`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'INVALID_STATUS');
  });

  test('Start Pickup -> transitions to IN_PROGRESS', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/start`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip.status, 'IN_PROGRESS');
  });

  test('Cannot start an already IN_PROGRESS trip', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/start`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'INVALID_STATUS');
  });

  test('Cannot complete trip while passengers are still PENDING', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/complete`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'INVALID_STATUS');
  });

  test('Record Boarding: Rahul -> BOARDED', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/boarding`, {
      name: 'Rahul',
      status: 'BOARDED'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.boardingRecord.name, 'Rahul');
    assert.strictEqual(res.body.boardingRecord.status, 'BOARDED');
  });

  test('Record Boarding: Aman -> BOARDED', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/boarding`, {
      name: 'Aman',
      status: 'BOARDED'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.boardingRecord.status, 'BOARDED');
  });

  test('Record Boarding: Priya -> MISSED', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/boarding`, {
      name: 'Priya',
      status: 'MISSED'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.boardingRecord.status, 'MISSED');
  });

  test('Record Boarding: Non-existent passenger returns 404', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/boarding`, {
      name: 'NonExistentPerson',
      status: 'BOARDED'
    });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'BOARDING_NOT_FOUND');
  });

  test('Record Boarding: Invalid status returns 400', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/boarding`, {
      name: 'Rahul',
      status: 'ABSENT'
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
  });

  test('Complete Trip -> status becomes COMPLETED', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/complete`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip.status, 'COMPLETED');
    assert.ok(res.body.trip.completedAt);

    // Verify all 3 passenger statuses
    const rahul = res.body.trip.passengers.find(p => p.name === 'Rahul');
    const aman = res.body.trip.passengers.find(p => p.name === 'Aman');
    const priya = res.body.trip.passengers.find(p => p.name === 'Priya');
    assert.strictEqual(rahul.status, 'BOARDED');
    assert.strictEqual(aman.status, 'BOARDED');
    assert.strictEqual(priya.status, 'MISSED');
  });

  test('Cannot start an already completed trip', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/start`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
  });

  test('Cannot complete an already completed trip', async () => {
    const res = await request(app, 'POST', `/api/trips/${tripId}/complete`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
  });

  test('Current trip after completion is null (Toto free)', async () => {
    const res = await request(app, 'GET', '/api/trips/current');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.trip, null);
  });
});
