// ── database.js ────────────────────────────────────────────
// This file sets up the SQLite database and provides helper
// functions to create, read, update, and delete habits.
// The database file is stored at data/habits.db and is
// created automatically the first time the server starts.

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ── Ensure the data/ folder exists ─────────────────────────
// SQLite needs a folder to store the .db file in.
// If data/ doesn't exist yet, we create it here.
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// ── Open the database ──────────────────────────────────────
// This creates the file if it doesn't exist, or opens it
// if it does. WAL mode makes reads and writes faster.
const db = new Database(path.join(dataDir, 'habits.db'));
db.pragma('journal_mode = WAL');

// ── Create the habits table ────────────────────────────────
// This runs every time the server starts, but "IF NOT EXISTS"
// means it only creates the table the first time.
// Columns:
//   id             — unique number for each habit (auto-generated)
//   name           — the habit's display name (required)
//   emoji          — an emoji to show on the card (default: star)
//   colour         — hex colour for the card accent (default: blue)
//   current_streak — how many days in a row the user has checked in
//   last_checked_in — the date string of the last check-in (e.g. "2025-03-15")
//   created_at     — when the habit was first created
db.exec(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '⭐',
    colour TEXT DEFAULT '#6c8cff',
    current_streak INTEGER DEFAULT 0,
    last_checked_in TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// ── getAllHabits() ──────────────────────────────────────────
// Returns every habit in the database, ordered by creation date.
// This is called by the GET /api/habits route.
function getAllHabits() {
  return db.prepare('SELECT * FROM habits ORDER BY created_at DESC').all();
}

// ── createHabit(name, emoji, colour) ───────────────────────
// Inserts a new habit into the database and returns it.
// This is called by the POST /api/habits route.
function createHabit(name, emoji, colour) {
  const stmt = db.prepare(
    'INSERT INTO habits (name, emoji, colour) VALUES (?, ?, ?)'
  );
  const result = stmt.run(name, emoji || '⭐', colour || '#6c8cff');
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
}

// ── checkinHabit(id) ───────────────────────────────────────
// Handles the daily check-in logic for a habit:
//   - If already checked in TODAY → return { alreadyDone: true }
//   - If last check-in was YESTERDAY → increment the streak
//   - Otherwise (or if never checked in) → reset streak to 1
// This is called by the PUT /api/habits/:id/checkin route.
function checkinHabit(id) {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  if (!habit) return null;

  // Get today's date and yesterday's date as strings like "2025-03-15"
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Already checked in today — don't double-count
  if (habit.last_checked_in === today) {
    return { ...habit, alreadyDone: true };
  }

  let newStreak;
  if (habit.last_checked_in === yesterday) {
    // Streak continues! Add one day.
    newStreak = habit.current_streak + 1;
  } else {
    // Streak broken (or first ever check-in). Start fresh at 1.
    newStreak = 1;
  }

  db.prepare(
    'UPDATE habits SET current_streak = ?, last_checked_in = ? WHERE id = ?'
  ).run(newStreak, today, id);

  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

// ── deleteHabit(id) ────────────────────────────────────────
// Removes a habit from the database permanently.
// This is called by the DELETE /api/habits/:id route.
function deleteHabit(id) {
  const result = db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Export all functions ───────────────────────────────────
// These are imported by server.js to handle API requests.
module.exports = { getAllHabits, createHabit, checkinHabit, deleteHabit };
