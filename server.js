// ── server.js ──────────────────────────────────────────────
// This is the main file that runs the entire application.
// It creates an Express web server that:
//   1. Serves the Habit Tracker app from the public/ folder
//   2. Serves the Task Guide app from the guide/ folder
//   3. Provides API routes for habit CRUD operations
//   4. Provides guide check routes for auto-checking tasks
//
// To start the server, run: npm start (or node server.js)

const express = require('express');
const path = require('path');
const fs = require('fs');
const { getAllHabits, createHabit, checkinHabit, deleteHabit } = require('./database');

const app = express();
const PORT = 3005;

// ── Middleware ──────────────────────────────────────────────
// express.json() lets us read JSON data sent from the frontend
// (e.g. when creating a new habit via POST request).
app.use(express.json());

// ── Serve the Habit Tracker (public/ folder) ───────────────
// Any file in the public/ folder is accessible from the browser.
// For example, public/style.css becomes http://localhost:3005/style.css
app.use(express.static(path.join(__dirname, 'public')));

// ── Serve the Task Guide (guide/ folder) ───────────────────
// The guide files are served at /guide/...
// For example, guide/style.css becomes http://localhost:3005/guide/style.css
app.use('/guide', express.static(path.join(__dirname, 'guide')));

// ════════════════════════════════════════════════════════════
// ── HABIT API ROUTES ───────────────────────────────────────
// These routes let the frontend talk to the database.
// ════════════════════════════════════════════════════════════

// ── GET /api/habits ────────────────────────────────────────
// Returns all habits as a JSON array.
// The frontend calls this when the page loads.
app.get('/api/habits', (req, res) => {
  try {
    const habits = getAllHabits();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// ── POST /api/habits ───────────────────────────────────────
// Creates a new habit. Expects JSON body with: name, emoji, colour.
// The frontend calls this when the user fills in the "New Habit" form.
app.post('/api/habits', (req, res) => {
  try {
    const { name, emoji, colour } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Habit name is required' });
    }
    const habit = createHabit(name.trim(), emoji, colour);
    res.status(201).json(habit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// ── PUT /api/habits/:id/checkin ────────────────────────────
// Checks in a habit for today. The streak logic is handled
// in database.js — see checkinHabit() for full details.
app.put('/api/habits/:id/checkin', (req, res) => {
  try {
    const result = checkinHabit(parseInt(req.params.id));
    if (!result) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// ── DELETE /api/habits/:id ─────────────────────────────────
// Deletes a habit permanently. The frontend calls this when
// the user clicks the delete button on a card.
app.delete('/api/habits/:id', (req, res) => {
  try {
    const deleted = deleteHabit(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

// ════════════════════════════════════════════════════════════
// ── TASK GUIDE CHECK ROUTES ────────────────────────────────
// These routes let the guide app automatically check whether
// the user has completed certain tasks. Each route reads a
// file and looks for the expected change.
// ════════════════════════════════════════════════════════════

// Helper: read a file's contents safely
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

app.get('/api/guide/check/:taskNumber', (req, res) => {
  const taskNum = parseInt(req.params.taskNumber);
  const stylePath = path.join(__dirname, 'public', 'style.css');
  const htmlPath = path.join(__dirname, 'public', 'index.html');

  switch (taskNum) {

    // ── Task 1: Change the page background colour ──────────
    // Check if --bg-page is no longer the default #f8f9ff
    case 1: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });

      const match = css.match(/--bg-page\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --bg-page variable in style.css' });

      const value = match[1].trim().toLowerCase();
      if (value === '#f8f9ff') {
        return res.json({ passed: false, message: 'The --bg-page value is still the default (#f8f9ff). Change it to a different colour!' });
      }
      return res.json({ passed: true, message: 'Nice! You changed the background colour to ' + value + '!' });
    }

    // ── Task 2: Make the cards more rounded ────────────────
    // Check if --card-radius is greater than 20px
    case 2: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });

      const match = css.match(/--card-radius\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --card-radius variable in style.css' });

      const value = match[1].trim();
      const num = parseInt(value);
      if (isNaN(num) || num <= 20) {
        return res.json({ passed: false, message: 'The --card-radius is ' + value + '. Make it larger than 20px (try 32px or 40px)!' });
      }
      return res.json({ passed: true, message: 'Great! Cards are now ' + value + ' rounded — looking smooth!' });
    }

    // ── Task 3: Change the page font (self-check) ─────────
    case 3: {
      return res.json({ passed: true, message: 'This is a self-check task. If you can see a different font in the browser, you did it!' });
    }

    // ── Task 4: Add a page title above the habit grid ──────
    // Check if index.html contains <h2> with "My Daily Habits"
    case 4: {
      const html = readFile(htmlPath);
      if (!html) return res.json({ passed: false, message: 'Could not read public/index.html' });

      const hasH2 = /<h2[^>]*>.*My Daily Habits.*<\/h2>/i.test(html);
      if (!hasH2) {
        return res.json({ passed: false, message: 'Could not find an <h2> element containing "My Daily Habits" in index.html.' });
      }
      return res.json({ passed: true, message: 'Awesome! The page title is showing up. Looking professional!' });
    }

    // ── Task 5: Add a footer to the page ───────────────────
    // Check if index.html contains a <footer> element
    case 5: {
      const html = readFile(htmlPath);
      if (!html) return res.json({ passed: false, message: 'Could not read public/index.html' });

      const hasFooter = /<footer[\s>]/i.test(html);
      if (!hasFooter) {
        return res.json({ passed: false, message: 'Could not find a <footer> element in index.html. Add one inside the .app container!' });
      }
      return res.json({ passed: true, message: 'Footer found! Your page now has a proper ending.' });
    }

    // ── Task 6: Change the check-in button colour ──────────
    // Check if --colour-done is no longer #4ecb71
    case 6: {
      const css = readFile(stylePath);
      if (!css) return res.json({ passed: false, message: 'Could not read public/style.css' });

      const match = css.match(/--colour-done\s*:\s*([^;]+)/);
      if (!match) return res.json({ passed: false, message: 'Could not find --colour-done variable in style.css' });

      const value = match[1].trim().toLowerCase();
      if (value === '#4ecb71') {
        return res.json({ passed: false, message: 'The --colour-done value is still the default (#4ecb71). Change it to a different colour!' });
      }
      return res.json({ passed: true, message: 'Check-in button is now ' + value + '. Looks great!' });
    }

    // ── Task 7: Make the empty state message funnier (self-check)
    case 7: {
      return res.json({ passed: true, message: 'This is a self-check task. If you see your new message when there are no habits, you did it!' });
    }

    // ── Task 8: Add a second emoji to streak display (self-check)
    case 8: {
      return res.json({ passed: true, message: 'This is a self-check task. If you can see a second emoji next to the streak number, you nailed it!' });
    }

    default:
      return res.json({ passed: false, message: 'Unknown task number: ' + taskNum });
  }
});

// ── Start the server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Habit Tracker is running at http://localhost:${PORT}`);
  console.log(`Task Guide is at http://localhost:${PORT}/guide`);
});
