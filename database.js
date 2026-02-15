const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const db = new Database(path.join(dataDir, 'habits.db'));
db.pragma('journal_mode = WAL');

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

const habitColumns = db.prepare('PRAGMA table_info(habits)').all();
if (!habitColumns.some((column) => column.name === 'archived_at')) {
  db.exec('ALTER TABLE habits ADD COLUMN archived_at TEXT');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS habit_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    checkin_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE (habit_id, checkin_date)
  )
`);

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAllHabits(options = {}) {
  const includeArchived = Boolean(options.includeArchived);
  const whereClause = includeArchived ? '' : 'WHERE archived_at IS NULL';
  return db.prepare(`SELECT * FROM habits ${whereClause} ORDER BY created_at DESC`).all();
}

function createHabit(name, emoji, colour) {
  const result = db.prepare(
    'INSERT INTO habits (name, emoji, colour) VALUES (?, ?, ?)'
  ).run(name, emoji || '⭐', colour || '#6c8cff');

  return db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
}

function updateHabit(id, updates) {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  if (!habit) return null;

  const name = updates.name ?? habit.name;
  const emoji = updates.emoji ?? habit.emoji;
  const colour = updates.colour ?? habit.colour;

  db.prepare(
    'UPDATE habits SET name = ?, emoji = ?, colour = ? WHERE id = ?'
  ).run(name, emoji, colour, id);

  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

function archiveHabit(id) {
  const result = db.prepare(
    "UPDATE habits SET archived_at = datetime('now') WHERE id = ? AND archived_at IS NULL"
  ).run(id);

  if (result.changes === 0) return null;
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

function restoreHabit(id) {
  const result = db.prepare('UPDATE habits SET archived_at = NULL WHERE id = ?').run(id);
  if (result.changes === 0) return null;
  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

function checkinHabit(id) {
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  if (!habit) return null;
  if (habit.archived_at) return { ...habit, archived: true };

  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const today = getLocalDateString(todayDate);
  const yesterday = getLocalDateString(yesterdayDate);

  if (habit.last_checked_in === today) {
    return { ...habit, alreadyDone: true };
  }

  const newStreak = habit.last_checked_in === yesterday ? habit.current_streak + 1 : 1;

  db.prepare(
    'UPDATE habits SET current_streak = ?, last_checked_in = ? WHERE id = ?'
  ).run(newStreak, today, id);

  db.prepare(
    'INSERT OR IGNORE INTO habit_checkins (habit_id, checkin_date) VALUES (?, ?)'
  ).run(id, today);

  return db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
}

function getHabitHistory(id, limit = 30) {
  return db.prepare(
    `
    SELECT checkin_date, created_at
    FROM habit_checkins
    WHERE habit_id = ?
    ORDER BY checkin_date DESC
    LIMIT ?
    `
  ).all(id, limit);
}

function deleteHabit(id) {
  const result = db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = {
  getAllHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  restoreHabit,
  checkinHabit,
  getHabitHistory,
  deleteHabit
};
