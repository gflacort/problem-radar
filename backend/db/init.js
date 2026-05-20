import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || './data/problems.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else {
        console.log('✓ Connected to SQLite database');

        // Read schema from file
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        // Execute schema
        db.exec(schema, (err) => {
          if (err) reject(err);
          else {
            console.log('✓ Database schema initialized');
            resolve(db);
          }
        });
      }
    });
  });
}

export function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase()
    .then(() => {
      console.log('✓ Database ready');
      process.exit(0);
    })
    .catch((err) => {
      console.error('✗ Database setup failed:', err);
      process.exit(1);
    });
}
