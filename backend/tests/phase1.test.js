const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Set test db
const testDbFile = path.join(__dirname, 'test_phase1.db');
process.env.DATABASE_FILE = testDbFile;

const { getDatabase, closeDatabase } = require('../src/db');
const app = require('../src/app');

// Helper to make test requests to the express app without needing external supertest
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

describe('Phase 1 - Request System', () => {
  before(() => {
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
    getDatabase(testDbFile);
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  });

  test('Health check endpoint', async () => {
    const res = await request(app, 'GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'healthy');
  });

  test('Create Request - Valid with 3 passengers (object format)', async () => {
    const payload = {
      from: 'College',
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [
        { name: 'Rahul' },
        { name: 'Aman' },
        { name: 'Priya' }
      ]
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.request);
    assert.strictEqual(res.body.request.from, 'College');
    assert.strictEqual(res.body.request.to, 'Station');
    assert.strictEqual(res.body.request.status, 'REQUESTED');
    assert.strictEqual(res.body.request.people.length, 3);
    assert.strictEqual(res.body.request.people[0].name, 'Rahul');
    assert.strictEqual(res.body.request.people[1].name, 'Aman');
    assert.strictEqual(res.body.request.people[2].name, 'Priya');
  });

  test('Create Request - Valid with string array format', async () => {
    const payload = {
      from: 'Station',
      to: 'Office',
      scheduledAt: '2026-10-03T11:00:00.000Z',
      people: ['Deepak', 'Sneha']
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.request.people.length, 2);
    assert.strictEqual(res.body.request.people[0].name, 'Deepak');
  });

  test('Reject Request - Missing origin / from', async () => {
    const payload = {
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [{ name: 'Rahul' }]
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
  });

  test('Reject Request - Empty passenger name', async () => {
    const payload = {
      from: 'College',
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: [
        { name: '' },
        { name: 'Rahul' }
      ]
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
  });

  test('Reject Request - Empty people array', async () => {
    const payload = {
      from: 'College',
      to: 'Station',
      scheduledAt: '2026-10-03T10:00:00.000Z',
      people: []
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
  });

  test('Reject Request - Invalid date', async () => {
    const payload = {
      from: 'College',
      to: 'Station',
      scheduledAt: 'not-a-valid-date',
      people: [{ name: 'Rahul' }]
    };

    const res = await request(app, 'POST', '/api/requests', payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'VALIDATION_ERROR');
  });

  test('List Requests - Returns ordered requests', async () => {
    const res = await request(app, 'GET', '/api/requests');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.requests));
    assert.strictEqual(res.body.requests.length >= 2, true);
    // Verify first request is 10:00 and second is 11:00
    assert.strictEqual(res.body.requests[0].from, 'College');
  });

  test('Get Request by ID', async () => {
    const res = await request(app, 'GET', '/api/requests/1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.request.id, 1);
    assert.strictEqual(res.body.request.people.length, 3);
  });

  test('Get Request by non-existent ID returns 404', async () => {
    const res = await request(app, 'GET', '/api/requests/9999');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'REQUEST_NOT_FOUND');
  });
});
