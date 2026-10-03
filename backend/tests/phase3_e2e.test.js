const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Set test db
const testDbFile = path.join(__dirname, 'test_phase3.db');
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

describe('Phase 3 - End-to-End Required Acceptance Tests & Edge Cases', () => {
  before(() => {
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
    getDatabase(testDbFile);
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  });

  let reqAId, reqBId, trip1Id;

  // Test 1: Request Creation
  test('Test 1 — Request Creation: College -> Station with 3 passengers persists', async () => {
    const res = await request(app, 'POST', '/api/requests', {
      from: 'College',
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [
        { name: 'Rahul' },
        { name: 'Aman' },
        { name: 'Priya' }
      ]
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.request.from, 'College');
    assert.strictEqual(res.body.request.to, 'Station');
    assert.strictEqual(res.body.request.people.length, 3);
    reqAId = res.body.request.id;
  });

  // Test 2: Same-Time Clash
  test('Test 2 — Same-Time Clash: Accept A, attempt to accept B at same time results in CLASH', async () => {
    // Create Request B at the same time
    const resB = await request(app, 'POST', '/api/requests', {
      from: 'Station',
      to: 'Office',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [{ name: 'Deepak' }]
    });
    assert.strictEqual(resB.status, 201);
    reqBId = resB.body.request.id;

    // Accept A
    const acceptA = await request(app, 'POST', `/api/requests/${reqAId}/accept`);
    assert.strictEqual(acceptA.status, 200);
    assert.strictEqual(acceptA.body.success, true);
    assert.strictEqual(acceptA.body.trip.status, 'ACCEPTED');
    trip1Id = acceptA.body.trip.id;

    // Attempt to accept B
    const acceptB = await request(app, 'POST', `/api/requests/${reqBId}/accept`);
    assert.strictEqual(acceptB.status, 409);
    assert.strictEqual(acceptB.body.success, false);
    assert.strictEqual(acceptB.body.error, 'CLASH');
    assert.strictEqual(acceptB.body.message, 'The Toto is already reserved for this time.');

    // Verify Request B was marked as CLASH
    const checkB = await request(app, 'GET', `/api/requests/${reqBId}`);
    assert.strictEqual(checkB.body.request.status, 'CLASH');
  });

  // Test 3: Boarding
  test('Test 3 — Boarding: Rahul -> BOARDED, Aman -> BOARDED, Priya -> MISSED', async () => {
    // Start pickup first
    const startRes = await request(app, 'POST', `/api/trips/${trip1Id}/start`);
    assert.strictEqual(startRes.status, 200);
    assert.strictEqual(startRes.body.trip.status, 'IN_PROGRESS');

    // Rahul -> BOARDED
    const rahulBoard = await request(app, 'POST', `/api/trips/${trip1Id}/boarding`, {
      name: 'Rahul',
      status: 'BOARDED'
    });
    assert.strictEqual(rahulBoard.status, 200);
    assert.strictEqual(rahulBoard.body.boardingRecord.status, 'BOARDED');

    // Aman -> BOARDED
    const amanBoard = await request(app, 'POST', `/api/trips/${trip1Id}/boarding`, {
      name: 'Aman',
      status: 'BOARDED'
    });
    assert.strictEqual(amanBoard.status, 200);
    assert.strictEqual(amanBoard.body.boardingRecord.status, 'BOARDED');

    // Priya -> MISSED
    const priyaBoard = await request(app, 'POST', `/api/trips/${trip1Id}/boarding`, {
      name: 'Priya',
      status: 'MISSED'
    });
    assert.strictEqual(priyaBoard.status, 200);
    assert.strictEqual(priyaBoard.body.boardingRecord.status, 'MISSED');
  });

  // Test 4: Completion
  test('Test 4 — Completion: trip.status = COMPLETED and Toto becomes available', async () => {
    const completeRes = await request(app, 'POST', `/api/trips/${trip1Id}/complete`);
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.body.trip.status, 'COMPLETED');
    assert.ok(completeRes.body.trip.completedAt);

    // Toto is available: current trip is null
    const currentTrip = await request(app, 'GET', '/api/trips/current');
    assert.strictEqual(currentTrip.status, 200);
    assert.strictEqual(currentTrip.body.trip, null);

    // Can accept another non-conflicting trip
    const reqC = await request(app, 'POST', '/api/requests', {
      from: 'Office',
      to: 'College',
      scheduledAt: '2026-10-03T14:00:00.000Z',
      people: [{ name: 'Sneha' }]
    });
    const acceptC = await request(app, 'POST', `/api/requests/${reqC.body.request.id}/accept`);
    assert.strictEqual(acceptC.status, 200);
    assert.strictEqual(acceptC.body.trip.status, 'ACCEPTED');
  });

  // Test 5: Person History
  test('Test 5 — Person History: Query Rahul, Aman, Priya', async () => {
    // Rahul history
    const rahulHist = await request(app, 'GET', '/api/history/person/Rahul');
    assert.strictEqual(rahulHist.status, 200);
    assert.strictEqual(rahulHist.body.success, true);
    assert.strictEqual(rahulHist.body.person, 'Rahul');
    assert.strictEqual(rahulHist.body.history.length, 1);
    assert.strictEqual(rahulHist.body.history[0].tripId, trip1Id);
    assert.strictEqual(rahulHist.body.history[0].from, 'College');
    assert.strictEqual(rahulHist.body.history[0].to, 'Station');
    assert.strictEqual(rahulHist.body.history[0].boardingStatus, 'BOARDED');
    assert.strictEqual(rahulHist.body.history[0].tripStatus, 'COMPLETED');

    // Aman history
    const amanHist = await request(app, 'GET', '/api/history/person/Aman');
    assert.strictEqual(amanHist.status, 200);
    assert.strictEqual(amanHist.body.history[0].boardingStatus, 'BOARDED');

    // Priya history
    const priyaHist = await request(app, 'GET', '/api/history/person/Priya');
    assert.strictEqual(priyaHist.status, 200);
    assert.strictEqual(priyaHist.body.history[0].boardingStatus, 'MISSED');

    // Non-existent person history returns empty list
    const nobodyHist = await request(app, 'GET', '/api/history/person/Nobody');
    assert.strictEqual(nobodyHist.status, 200);
    assert.strictEqual(nobodyHist.body.history.length, 0);
  });

  // Test 6: Rider History
  test('Test 6 — Rider History: Verified with passenger breakdown and summary', async () => {
    const riderHist = await request(app, 'GET', '/api/history/rider');
    assert.strictEqual(riderHist.status, 200);
    assert.strictEqual(riderHist.body.success, true);
    assert.strictEqual(riderHist.body.history.length >= 2, true);

    const trip1Record = riderHist.body.history.find(h => h.tripId === trip1Id);
    assert.ok(trip1Record);
    assert.strictEqual(trip1Record.from, 'College');
    assert.strictEqual(trip1Record.to, 'Station');
    assert.strictEqual(trip1Record.status, 'COMPLETED');
    assert.strictEqual(trip1Record.summary.requested, 3);
    assert.strictEqual(trip1Record.summary.boarded, 2);
    assert.strictEqual(trip1Record.summary.missed, 1);
  });

  // Edge Cases Testing
  describe('Edge Cases', () => {
    test('Empty passenger name rejected', async () => {
      const res = await request(app, 'POST', '/api/requests', {
        from: 'College',
        to: 'Station',
        scheduledAt: '2026-10-03T16:00:00.000Z',
        people: [{ name: '   ' }]
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Missing destination rejected', async () => {
      const res = await request(app, 'POST', '/api/requests', {
        from: 'College',
        scheduledAt: '2026-10-03T16:00:00.000Z',
        people: [{ name: 'Karan' }]
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Missing time rejected', async () => {
      const res = await request(app, 'POST', '/api/requests', {
        from: 'College',
        to: 'Station',
        people: [{ name: 'Karan' }]
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Invalid request ID rejected', async () => {
      const res = await request(app, 'GET', '/api/requests/notanid');
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Invalid trip ID rejected', async () => {
      const res = await request(app, 'GET', '/api/trips/notanid');
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Duplicate acceptance rejected', async () => {
      const res = await request(app, 'POST', `/api/requests/${reqAId}/accept`);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
    });

    test('Starting an already completed trip rejected', async () => {
      const res = await request(app, 'POST', `/api/trips/${trip1Id}/start`);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
    });

    test('Completing an already completed trip rejected', async () => {
      const res = await request(app, 'POST', `/api/trips/${trip1Id}/complete`);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
    });

    test('Boarding person not belonging to trip rejected with 404', async () => {
      const res = await request(app, 'POST', `/api/trips/${trip1Id}/boarding`, {
        name: 'GhostPassenger',
        status: 'BOARDED'
      });
      assert.strictEqual(res.status, 400); // Because trip is completed
      assert.strictEqual(res.body.error, 'ALREADY_COMPLETED');
    });

    test('Invalid boarding status rejected', async () => {
      // Create fresh trip
      const reqD = await request(app, 'POST', '/api/requests', {
        from: 'Station',
        to: 'College',
        scheduledAt: '2026-10-03T18:00:00.000Z',
        people: [{ name: 'Tanvi' }]
      });
      const acceptD = await request(app, 'POST', `/api/requests/${reqD.body.request.id}/accept`);
      const freshTripId = acceptD.body.trip.id;

      const res = await request(app, 'POST', `/api/trips/${freshTripId}/boarding`, {
        name: 'Tanvi',
        status: 'CANCELLED_INVALID'
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
    });

    test('Simultaneous conflicting acceptance requests handled cleanly', async () => {
      // Create two requests for exact same future time
      const time = '2026-10-04T12:00:00.000Z';
      const [r1, r2] = await Promise.all([
        request(app, 'POST', '/api/requests', {
          from: 'College',
          to: 'Station',
          scheduledAt: time,
          people: [{ name: 'Person1' }]
        }),
        request(app, 'POST', '/api/requests', {
          from: 'Station',
          to: 'Office',
          scheduledAt: time,
          people: [{ name: 'Person2' }]
        })
      ]);

      const [res1, res2] = await Promise.all([
        request(app, 'POST', `/api/requests/${r1.body.request.id}/accept`),
        request(app, 'POST', `/api/requests/${r2.body.request.id}/accept`)
      ]);

      const statuses = [res1.status, res2.status].sort();
      // One must be 200 and one must be 409
      assert.strictEqual(statuses[0], 200);
      assert.strictEqual(statuses[1], 409);

      const conflictRes = res1.status === 409 ? res1 : res2;
      assert.strictEqual(conflictRes.body.error, 'CLASH');
    });
  });
});
