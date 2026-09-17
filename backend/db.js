// db.js — اتصال به دیتابیس واقعی SQLite (فایل‌محور، بدون نیاز به سرور جدا)
// برای شروع کافیست؛ وقتی ترافیک بالا رفت می‌توانید به PostgreSQL مهاجرت کنید.
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'eshete.db'));
db.pragma('journal_mode = WAL');

// ---------- ساخت جداول (در صورت نبودن) ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'violet',
  blocks_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount_toman INTEGER NOT NULL,
  authority TEXT,
  ref_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'lottery',
  prize TEXT,
  entry_condition TEXT,
  goal INTEGER NOT NULL DEFAULT 100,
  progress INTEGER NOT NULL DEFAULT 0,
  ends_at TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
