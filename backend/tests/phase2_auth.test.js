const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

// Set test db
const testDbFile = path.join(__dirname, 'test_phase2_auth.db');
process.env.DATABASE_FILE = testDbFile;
process.env.ADMIN_EMAIL = 'admin@lawazia.com';
process.env.ADMIN_PASSWORD = 'Admin@123456';
process.env.ADMIN_NAME = 'Admin User';

const { getDatabase, closeDatabase } = require('../src/db');
const app = require('../src/app');

async function request(app, method, url, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const http = require('node:http');
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method,
        headers
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

describe('Phase 2 - Authentication, Roles & Authorization', () => {
  before(() => {
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
    getDatabase(testDbFile);
  });

  after(() => {
    closeDatabase();
    if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);
  });

  let userToken, riderToken, adminToken;

  test('User Signup creates USER role', async () => {
    const res = await request(app, 'POST', '/api/auth/signup', {
      name: 'Alice Sharma',
      email: 'alice@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'USER');
    assert.strictEqual(res.body.user.email, 'alice@example.com');
    assert.ok(res.body.token);
    userToken = res.body.token;
  });

  test('User Signup rejects duplicate email', async () => {
    const res = await request(app, 'POST', '/api/auth/signup', {
      name: 'Alice Duplicate',
      email: 'alice@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.error, 'DUPLICATE_EMAIL');
  });

  test('Rider Signup creates RIDER role', async () => {
    const res = await request(app, 'POST', '/api/auth/rider/signup', {
      name: 'Bob Driver',
      email: 'bob@example.com',
      password: 'password123'
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'RIDER');
    assert.ok(res.body.token);
    riderToken = res.body.token;
  });

  test('Admin Login with seeded credentials', async () => {
    const res = await request(app, 'POST', '/api/auth/login', {
      email: 'admin@lawazia.com',
      password: 'Admin@123456'
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'ADMIN');
    assert.ok(res.body.token);
    adminToken = res.body.token;
  });

  test('Login fails with invalid password', async () => {
    const res = await request(app, 'POST', '/api/auth/login', {
      email: 'alice@example.com',
      password: 'wrongpassword'
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'INVALID_CREDENTIALS');
  });

  test('GET /api/auth/me returns current authenticated user', async () => {
    const res = await request(app, 'GET', '/api/auth/me', null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, 'alice@example.com');
    assert.strictEqual(res.body.user.role, 'USER');
  });

  test('USER cannot access Admin Overview (403 Forbidden)', async () => {
    const res = await request(app, 'GET', '/api/admin/overview', null, userToken);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'FORBIDDEN');
  });

  test('RIDER cannot access Admin Users (403 Forbidden)', async () => {
    const res = await request(app, 'GET', '/api/admin/users', null, riderToken);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'FORBIDDEN');
  });

  test('Unauthenticated user cannot access Admin (401 Unauthorized)', async () => {
    const res = await request(app, 'GET', '/api/admin/overview');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'UNAUTHORIZED');
  });

  test('ADMIN can access Admin Overview and Users', async () => {
    const overviewRes = await request(app, 'GET', '/api/admin/overview', null, adminToken);
    assert.strictEqual(overviewRes.status, 200);
    assert.strictEqual(overviewRes.body.success, true);
    assert.strictEqual(overviewRes.body.stats.users.totalUsers, 1);
    assert.strictEqual(overviewRes.body.stats.users.totalRiders, 1);
    assert.strictEqual(overviewRes.body.stats.users.totalAdmins, 1);

    const usersRes = await request(app, 'GET', '/api/admin/users', null, adminToken);
    assert.strictEqual(usersRes.status, 200);
    assert.strictEqual(usersRes.body.users.length, 3);
  });
});
