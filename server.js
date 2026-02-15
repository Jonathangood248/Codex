const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  getAllHabits,
  createHabit,
  updateHabit,
  archiveHabit,
  restoreHabit,
  checkinHabit,
  getHabitHistory,
  deleteHabit
} = require('./database');

const app = express();
const PORT = 3005;

function parseHabitId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function parseCreateHabitBody(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body' };
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const emoji = typeof body.emoji === 'string' ? body.emoji.trim() : '';
  const colour = typeof body.colour === 'string' ? body.colour.trim() : '';

  if (!name) return { error: 'Habit name is required' };
  if (name.length > 50) return { error: 'Habit name must be 50 characters or fewer' };
  if (emoji && emoji.length > 8) return { error: 'Emoji is too long' };
  if (colour && !/^#[0-9a-fA-F]{6}$/.test(colour)) {
    return { error: 'Card colour must be a valid hex value (e.g. #6c8cff)' };
  }

  return {
    name,
    emoji: emoji || '⭐',
    colour: colour || '#6c8cff'
  };
}

function parseUpdateHabitBody(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Invalid request body' };
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return { error: 'Habit name is required' };
    }
    if (body.name.trim().length > 50) {
      return { error: 'Habit name must be 50 characters or fewer' };
    }
    updates.name = body.name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'emoji')) {
    if (typeof body.emoji !== 'string') {
      return { error: 'Emoji must be a string' };
    }
    const trimmed = body.emoji.trim();
    if (trimmed && trimmed.length > 8) {
      return { error: 'Emoji is too long' };
    }
    updates.emoji = trimmed || '⭐';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'colour')) {
    if (typeof body.colour !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(body.colour.trim())) {
      return { error: 'Card colour must be a valid hex value (e.g. #6c8cff)' };
    }
    updates.colour = body.colour.trim();
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'No valid fields to update' };
  }

  return { updates };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/guide', express.static(path.join(__dirname, 'guide')));

app.get('/api/habits', (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === '1';
    const habits = getAllHabits({ includeArchived });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', (req, res) => {
  try {
    const parsed = parseCreateHabitBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const habit = createHabit(parsed.name, parsed.emoji, parsed.colour);
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.put('/api/habits/:id', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const parsed = parseUpdateHabitBody(req.body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const habit = updateHabit(id, parsed.updates);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

app.put('/api/habits/:id/checkin', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const result = checkinHabit(id);
    if (!result) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    if (result.archived) {
      return res.status(400).json({ error: 'Archived habits cannot be checked in' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

app.patch('/api/habits/:id/archive', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const habit = archiveHabit(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive habit' });
  }
});

app.patch('/api/habits/:id/restore', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const habit = restoreHabit(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore habit' });
  }
});

app.get('/api/habits/:id/history', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const limitRaw = Number(req.query.limit);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 90 ? limitRaw : 30;
    const history = getHabitHistory(id, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/api/habits/:id', (req, res) => {
  try {
    const id = parseHabitId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid habit id' });
    }

    const deleted = deleteHabit(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

app.get('/api/guide/check/:taskNumber', (req, res) => {
  const taskNum = parseInt(req.params.taskNumber, 10);
  const stylePath = path.join(__dirname, 'public', 'style.css');
  const htmlPath = path.join(__dirname, 'public', 'index.html');

  switch (taskNum) {
    case 1: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });
      const match = css.match(/--bg-page\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --bg-page variable in style.css' });
      const value = match[1].trim().toLowerCase();
      if (value === '#f8f9ff') {
        return res.json({ passed: false, message: 'The --bg-page value is still the default (#f8f9ff). Change it to a different colour!' });
      }
      return res.json({ passed: true, message: `Nice! You changed the background colour to ${value}!` });
    }

    case 2: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });
      const match = css.match(/--card-radius\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --card-radius variable in style.css' });
      const value = match[1].trim();
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num <= 20) {
        return res.json({ passed: false, message: `The --card-radius is ${value}. Make it larger than 20px (try 32px or 40px)!` });
      }
      return res.json({ passed: true, message: `Great! Cards are now ${value} rounded - looking smooth!` });
    }

    case 3:
      return res.json({ passed: true, message: 'This is a self-check task. If you can see a different font in the browser, you did it!' });

    case 4: {
      const html = readFile(htmlPath);
      if (!html) return res.json({ passed: false, message: 'Could not read public/index.html' });
      const hasH2 = /<h2[^>]*>.*My Daily Habits.*<\/h2>/i.test(html);
      if (!hasH2) {
        return res.json({ passed: false, message: 'Could not find an <h2> element containing "My Daily Habits" in index.html.' });
      }
      return res.json({ passed: true, message: 'Awesome! The page title is showing up. Looking professional!' });
    }

    case 5: {
      const html = readFile(htmlPath);
      if (!html) return res.json({ passed: false, message: 'Could not read public/index.html' });
      const hasFooter = /<footer[\s>]/i.test(html);
      if (!hasFooter) {
        return res.json({ passed: false, message: 'Could not find a <footer> element in index.html. Add one inside the .app container!' });
      }
      return res.json({ passed: true, message: 'Footer found! Your page now has a proper ending.' });
    }

    case 6: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });
      const match = css.match(/--colour-done\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --colour-done variable in style.css' });
      const value = match[1].trim().toLowerCase();
      if (value === '#4ecb71') {
        return res.json({ passed: false, message: 'The --colour-done value is still the default (#4ecb71). Change it to a different colour!' });
      }
      return res.json({ passed: true, message: `Check-in button is now ${value}. Looks great!` });
    }

    case 7:
      return res.json({ passed: true, message: 'This is a self-check task. If you see your new message when there are no habits, you did it!' });

    case 8:
      return res.json({ passed: true, message: 'This is a self-check task. If you can see a second emoji next to the streak number, you nailed it!' });

    default:
      return res.json({ passed: false, message: `Unknown task number: ${taskNum}` });
  }
});

app.listen(PORT, () => {
  console.log(`Habit Tracker is running at http://localhost:${PORT}`);
  console.log(`Task Guide is at http://localhost:${PORT}/guide`);
});
