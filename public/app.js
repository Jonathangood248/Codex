// ════════════════════════════════════════════════════════════
// ── app.js — Habit Tracker Frontend Logic ──────────────────
// This file handles all the interactive behaviour of the
// habit tracker: loading habits from the server, creating
// new ones, checking in, and deleting.
//
// It runs in the browser and talks to the Express server
// using fetch() to call the API routes defined in server.js.
// ════════════════════════════════════════════════════════════

// ── DOM Element References ─────────────────────────────────
// We grab references to the HTML elements we need to
// interact with. This avoids searching for them every time.
const habitsGrid = document.getElementById('habits-grid');
const newHabitBtn = document.getElementById('new-habit-btn');
const newHabitForm = document.getElementById('new-habit-form');
const saveHabitBtn = document.getElementById('save-habit-btn');
const cancelHabitBtn = document.getElementById('cancel-habit-btn');
const habitNameInput = document.getElementById('habit-name');
const habitEmojiInput = document.getElementById('habit-emoji');
const habitColourInput = document.getElementById('habit-colour');

// ── Toggle New Habit Form ──────────────────────────────────
// When the user clicks "+ New Habit", show the form.
// When they click "Cancel", hide it and clear the fields.
newHabitBtn.addEventListener('click', () => {
  newHabitForm.style.display = 'block';
  habitNameInput.focus();
});

cancelHabitBtn.addEventListener('click', () => {
  newHabitForm.style.display = 'none';
  clearForm();
});

// ── clearForm() ────────────────────────────────────────────
// Resets the form fields back to their default values.
// Called after saving a new habit or clicking cancel.
function clearForm() {
  habitNameInput.value = '';
  habitEmojiInput.value = '⭐';
  habitColourInput.value = '#6c8cff';
}

// ── Save New Habit ─────────────────────────────────────────
// When the user clicks "Save Habit", we send the form data
// to the server via POST /api/habits, then reload all habits.
saveHabitBtn.addEventListener('click', async () => {
  const name = habitNameInput.value.trim();
  if (!name) {
    habitNameInput.style.borderColor = '#f05656';
    habitNameInput.focus();
    return;
  }

  try {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        emoji: habitEmojiInput.value || '⭐',
        colour: habitColourInput.value || '#6c8cff'
      })
    });

    if (response.ok) {
      newHabitForm.style.display = 'none';
      clearForm();
      loadHabits();
    }
  } catch (err) {
    console.error('Failed to create habit:', err);
  }
});

// ── Reset input border on typing ───────────────────────────
// If the name field was highlighted red (empty validation),
// reset it when the user starts typing.
habitNameInput.addEventListener('input', () => {
  habitNameInput.style.borderColor = '#e9ecef';
});

// ── loadHabits() ───────────────────────────────────────────
// Fetches all habits from the server (GET /api/habits)
// and passes them to renderHabits() to display on screen.
// This runs when the page first loads and after any change.
async function loadHabits() {
  try {
    const response = await fetch('/api/habits');
    const habits = await response.json();
    renderHabits(habits);
  } catch (err) {
    console.error('Failed to load habits:', err);
  }
}

// ── renderHabits(habits) ───────────────────────────────────
// This function takes the list of habits from the server
// and builds the HTML cards you see on screen.
// It runs every time habits are loaded or updated.
function renderHabits(habits) {
  // If there are no habits, show a friendly empty state
  if (habits.length === 0) {
    habitsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🌱</div>
        <h3>No habits yet!</h3>
        <p>Click "+ New Habit" to start tracking your first habit.</p>
      </div>
    `;
    return;
  }

  // Build an HTML card for each habit
  habitsGrid.innerHTML = habits.map(habit => {
    // Check if this habit was already checked in today
    const today = new Date().toISOString().slice(0, 10);
    const isDoneToday = habit.last_checked_in === today;

    return `
      <div class="habit-card" style="border-top-color: ${habit.colour}">
        <button class="btn-delete" onclick="deleteHabit(${habit.id})" title="Delete habit">&times;</button>
        <div class="habit-emoji">${habit.emoji}</div>
        <div class="habit-name">${habit.name}</div>
        <div class="habit-streak">
          🔥 <span class="streak-number">${habit.current_streak}</span> day${habit.current_streak !== 1 ? 's' : ''}
        </div>
        <button
          class="btn-checkin ${isDoneToday ? 'done' : ''}"
          onclick="${isDoneToday ? '' : `checkinHabit(${habit.id})`}"
          ${isDoneToday ? 'disabled' : ''}
        >
          ${isDoneToday ? '✓ Done Today' : 'Check In'}
        </button>
      </div>
    `;
  }).join('');
}

// ── checkinHabit(id) ───────────────────────────────────────
// Called when the user clicks "Check In" on a habit card.
// Sends a PUT request to the server to record today's check-in.
// The server handles the streak logic (see database.js).
async function checkinHabit(id) {
  try {
    const response = await fetch(`/api/habits/${id}/checkin`, {
      method: 'PUT'
    });

    if (response.ok) {
      loadHabits();
    }
  } catch (err) {
    console.error('Failed to check in:', err);
  }
}

// ── deleteHabit(id) ────────────────────────────────────────
// Called when the user clicks the × button on a habit card.
// Shows a confirmation dialog, then sends a DELETE request
// to the server to remove the habit permanently.
async function deleteHabit(id) {
  if (!confirm('Delete this habit? This cannot be undone.')) return;

  try {
    const response = await fetch(`/api/habits/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadHabits();
    }
  } catch (err) {
    console.error('Failed to delete habit:', err);
  }
}

// ── Initial Load ───────────────────────────────────────────
// When the page first opens, load all habits from the server
// and display them as cards.
loadHabits();
