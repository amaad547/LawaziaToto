const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

let dbInstance = null;

function getDatabase(dbPath) {
  if (dbInstance) return dbInstance;

  const targetPath = dbPath || process.env.DATABASE_FILE || path.join(__dirname, '..', 'toto.db');
  
  // If targetPath is not ':memory:', ensure directory exists
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  initSchema(db);

  dbInstance = db;
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REQUESTED', -- 'REQUESTED', 'ACCEPTED', 'CLASH'
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_requests_scheduled_at ON requests(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

    CREATE TABLE IF NOT EXISTS request_people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_request_people_request_id ON request_people(request_id);
    CREATE INDEX IF NOT EXISTS idx_request_people_name ON request_people(name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL UNIQUE,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACCEPTED', -- 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'
      accepted_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trips_scheduled_at ON trips(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_single_active_time ON trips(scheduled_at) WHERE status IN ('ACCEPTED', 'IN_PROGRESS');

    CREATE TABLE IF NOT EXISTS boarding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      person_id INTEGER,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'BOARDED', 'MISSED'
      updated_at TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_boarding_trip_id ON boarding_records(trip_id);
    CREATE INDEX IF NOT EXISTS idx_boarding_name ON boarding_records(name COLLATE NOCASE);
  `);
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};
