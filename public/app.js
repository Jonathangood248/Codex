const habitsGrid = document.getElementById('habits-grid');
const newHabitBtn = document.getElementById('new-habit-btn');
const newHabitForm = document.getElementById('new-habit-form');
const saveHabitBtn = document.getElementById('save-habit-btn');
const cancelHabitBtn = document.getElementById('cancel-habit-btn');
const habitNameInput = document.getElementById('habit-name');
const habitEmojiInput = document.getElementById('habit-emoji');
const habitColourInput = document.getElementById('habit-colour');

const editHabitForm = document.getElementById('edit-habit-form');
const editHabitNameInput = document.getElementById('edit-habit-name');
const editHabitEmojiInput = document.getElementById('edit-habit-emoji');
const editHabitColourInput = document.getElementById('edit-habit-colour');
const updateHabitBtn = document.getElementById('update-habit-btn');
const cancelEditHabitBtn = document.getElementById('cancel-edit-habit-btn');
const toggleArchivedBtn = document.getElementById('toggle-archived-btn');

const weatherStatus = document.getElementById('weather-status');
const weatherForecast = document.getElementById('weather-forecast');

const weatherCodeDescriptions = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunder w/ hail',
  99: 'Severe thunderstorm'
};

const uiState = {
  includeArchived: false,
  editingHabitId: null,
  openHistoryHabitId: null,
  habitsById: new Map()
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function clearCreateForm() {
  habitNameInput.value = '';
  habitEmojiInput.value = '⭐';
  habitColourInput.value = '#6c8cff';
}

function clearEditForm() {
  uiState.editingHabitId = null;
  editHabitNameInput.value = '';
  editHabitEmojiInput.value = '';
  editHabitColourInput.value = '#6c8cff';
  editHabitForm.style.display = 'none';
}

newHabitBtn.addEventListener('click', () => {
  newHabitForm.style.display = 'block';
  habitNameInput.focus();
});

cancelHabitBtn.addEventListener('click', () => {
  newHabitForm.style.display = 'none';
  clearCreateForm();
});

cancelEditHabitBtn.addEventListener('click', () => {
  clearEditForm();
});

toggleArchivedBtn.addEventListener('click', () => {
  uiState.includeArchived = !uiState.includeArchived;
  toggleArchivedBtn.textContent = uiState.includeArchived ? 'Hide Archived' : 'Show Archived';
  loadHabits();
});

saveHabitBtn.addEventListener('click', async () => {
  const name = habitNameInput.value.trim();
  if (!name) {
    habitNameInput.style.borderColor = '#f05656';
    habitNameInput.focus();
    return;
  }

  try {
    await fetchJson('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        emoji: habitEmojiInput.value || '⭐',
        colour: habitColourInput.value || '#6c8cff'
      })
    });

    newHabitForm.style.display = 'none';
    clearCreateForm();
    await loadHabits();
  } catch (err) {
    console.error('Failed to create habit:', err);
    alert(err.message);
  }
});

updateHabitBtn.addEventListener('click', async () => {
  if (!uiState.editingHabitId) return;

  const name = editHabitNameInput.value.trim();
  if (!name) {
    editHabitNameInput.style.borderColor = '#f05656';
    editHabitNameInput.focus();
    return;
  }

  try {
    await fetchJson(`/api/habits/${uiState.editingHabitId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        emoji: editHabitEmojiInput.value || '⭐',
        colour: editHabitColourInput.value || '#6c8cff'
      })
    });

    clearEditForm();
    await loadHabits();
  } catch (err) {
    console.error('Failed to update habit:', err);
    alert(err.message);
  }
});

habitNameInput.addEventListener('input', () => {
  habitNameInput.style.borderColor = '#e9ecef';
});

editHabitNameInput.addEventListener('input', () => {
  editHabitNameInput.style.borderColor = '#e9ecef';
});

habitsGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  if (!Number.isInteger(id) || id <= 0) return;

  try {
    if (button.dataset.action === 'checkin') {
      await fetchJson(`/api/habits/${id}/checkin`, { method: 'PUT' });
      await loadHabits();
      return;
    }

    if (button.dataset.action === 'delete') {
      if (!confirm('Delete this habit permanently? This cannot be undone.')) return;
      await fetchJson(`/api/habits/${id}`, { method: 'DELETE' });
      await loadHabits();
      return;
    }

    if (button.dataset.action === 'archive') {
      await fetchJson(`/api/habits/${id}/archive`, { method: 'PATCH' });
      await loadHabits();
      return;
    }

    if (button.dataset.action === 'restore') {
      await fetchJson(`/api/habits/${id}/restore`, { method: 'PATCH' });
      await loadHabits();
      return;
    }

    if (button.dataset.action === 'edit') {
      openEditForm(id);
      return;
    }

    if (button.dataset.action === 'history') {
      await toggleHistory(id);
    }
  } catch (err) {
    console.error('Action failed:', err);
    alert(err.message);
  }
});

function openEditForm(id) {
  const habit = uiState.habitsById.get(id);
  if (!habit) return;

  uiState.editingHabitId = id;
  editHabitNameInput.value = habit.name || '';
  editHabitEmojiInput.value = habit.emoji || '⭐';
  editHabitColourInput.value = /^#[0-9a-fA-F]{6}$/.test(habit.colour || '') ? habit.colour : '#6c8cff';
  editHabitForm.style.display = 'block';
  editHabitNameInput.focus();
}

async function loadHabits() {
  try {
    const suffix = uiState.includeArchived ? '?includeArchived=1' : '';
    const habits = await fetchJson(`/api/habits${suffix}`);
    uiState.habitsById = new Map(habits.map((habit) => [habit.id, habit]));

    if (uiState.openHistoryHabitId && !uiState.habitsById.has(uiState.openHistoryHabitId)) {
      uiState.openHistoryHabitId = null;
    }

    renderHabits(habits);
  } catch (err) {
    console.error('Failed to load habits:', err);
  }
}

async function toggleHistory(id) {
  if (uiState.openHistoryHabitId === id) {
    uiState.openHistoryHabitId = null;
    renderHabits([...uiState.habitsById.values()]);
    return;
  }

  uiState.openHistoryHabitId = id;
  renderHabits([...uiState.habitsById.values()]);

  const historyContainer = habitsGrid.querySelector(`.habit-history[data-id="${id}"]`);
  if (!historyContainer) return;

  historyContainer.innerHTML = '<div class="habit-history-empty">Loading history...</div>';

  try {
    const entries = await fetchJson(`/api/habits/${id}/history?limit=14`);
    renderHistory(entries, historyContainer);
  } catch (err) {
    historyContainer.innerHTML = '<div class="habit-history-empty">Could not load history.</div>';
  }
}

function renderHistory(entries, container) {
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="habit-history-empty">No check-ins yet.</div>';
    return;
  }

  const title = document.createElement('div');
  title.className = 'habit-history-title';
  title.textContent = 'Recent check-ins';

  const list = document.createElement('ul');
  list.className = 'habit-history-list';

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'habit-history-item';

    const date = new Date(`${entry.checkin_date}T12:00:00`);
    const displayDate = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const left = document.createElement('span');
    left.textContent = displayDate;
    const right = document.createElement('span');
    right.textContent = entry.checkin_date;
    item.append(left, right);
    list.appendChild(item);
  });

  container.innerHTML = '';
  container.append(title, list);
}

function getWeatherDescription(code) {
  return weatherCodeDescriptions[code] || 'Unknown';
}

function getForecastLabel(dateString, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(dateString).toLocaleDateString(undefined, { weekday: 'short' });
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000
    });
  });
}

async function loadWeatherForecast() {
  if (!weatherStatus || !weatherForecast) return;

  weatherStatus.textContent = 'Fetching local weather...';
  weatherForecast.innerHTML = '';

  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', latitude);
    weatherUrl.searchParams.set('longitude', longitude);
    weatherUrl.searchParams.set('current', 'temperature_2m,weather_code');
    weatherUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    weatherUrl.searchParams.set('forecast_days', '3');
    weatherUrl.searchParams.set('timezone', 'auto');

    const data = await fetchJson(weatherUrl.toString());
    const temperatureUnit = data?.current_units?.temperature_2m || '°C';
    const currentTemp = Math.round(data?.current?.temperature_2m);
    const currentCode = data?.current?.weather_code;
    const description = getWeatherDescription(currentCode);

    weatherStatus.textContent = `Now ${currentTemp}${temperatureUnit} - ${description}`;

    const times = data?.daily?.time || [];
    const maxTemps = data?.daily?.temperature_2m_max || [];
    const minTemps = data?.daily?.temperature_2m_min || [];

    weatherForecast.innerHTML = times.slice(0, 3).map((dateString, index) => `
      <div class="forecast-day">
        <span class="forecast-day-name">${getForecastLabel(dateString, index)}</span>
        <span class="forecast-day-temp">${Math.round(maxTemps[index])}${temperatureUnit} / ${Math.round(minTemps[index])}${temperatureUnit}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load weather:', error);
    weatherStatus.textContent = 'Weather unavailable. Enable location to see forecast.';
    weatherForecast.innerHTML = '';
  }
}

function createActionButton(label, action, id, extraClass = '') {
  const button = document.createElement('button');
  button.className = `habit-action-btn ${extraClass}`.trim();
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(id);
  return button;
}

function renderHabits(habits) {
  const activeHabits = habits.filter((habit) => !habit.archived_at);
  const archivedHabits = habits.filter((habit) => habit.archived_at);

  if (activeHabits.length === 0 && (!uiState.includeArchived || archivedHabits.length === 0)) {
    habitsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🌱</div>
        <h3>Your habit garden is empty... time to plant some seeds! 🌱</h3>
        <p>Click "+ New Habit" to start tracking your first habit.</p>
      </div>
    `;
    return;
  }

  habitsGrid.innerHTML = '';
  const today = getLocalDateString();

  const renderList = uiState.includeArchived ? [...activeHabits, ...archivedHabits] : activeHabits;

  renderList.forEach((habit, index) => {
    if (uiState.includeArchived && archivedHabits.length > 0 && index === activeHabits.length) {
      const archivedHeading = document.createElement('h3');
      archivedHeading.className = 'archived-heading';
      archivedHeading.textContent = 'Archived Habits';
      habitsGrid.appendChild(archivedHeading);
    }

    const isDoneToday = habit.last_checked_in === today;

    const card = document.createElement('div');
    card.className = `habit-card ${habit.archived_at ? 'archived' : ''}`.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(habit.colour || '')) {
      card.style.borderTopColor = habit.colour;
    }

    const emoji = document.createElement('div');
    emoji.className = 'habit-emoji';
    emoji.textContent = habit.emoji || '⭐';

    const name = document.createElement('div');
    name.className = 'habit-name';
    name.textContent = habit.name || 'Untitled habit';

    const streak = document.createElement('div');
    streak.className = 'habit-streak';
    const streakNumber = document.createElement('span');
    streakNumber.className = 'streak-number';
    streakNumber.textContent = String(habit.current_streak || 0);
    streak.append('🔥 ');
    streak.appendChild(streakNumber);
    streak.append(` day${habit.current_streak !== 1 ? 's' : ''}`);

    const actions = document.createElement('div');
    actions.className = 'habit-actions';
    actions.appendChild(createActionButton('History', 'history', habit.id));

    if (habit.archived_at) {
      actions.appendChild(createActionButton('Restore', 'restore', habit.id, 'restore'));
      actions.appendChild(createActionButton('Delete', 'delete', habit.id, 'archive'));
    } else {
      actions.appendChild(createActionButton('Edit', 'edit', habit.id));
      actions.appendChild(createActionButton('Archive', 'archive', habit.id, 'archive'));
    }

    const checkinBtn = document.createElement('button');
    checkinBtn.className = `btn-checkin ${isDoneToday ? 'done' : ''}`.trim();
    checkinBtn.textContent = isDoneToday ? '✓ Done Today' : 'Check In';
    checkinBtn.disabled = isDoneToday || Boolean(habit.archived_at);
    if (!isDoneToday && !habit.archived_at) {
      checkinBtn.dataset.action = 'checkin';
      checkinBtn.dataset.id = String(habit.id);
    }

    const history = document.createElement('div');
    history.className = 'habit-history';
    history.dataset.id = String(habit.id);
    history.style.display = uiState.openHistoryHabitId === habit.id ? 'block' : 'none';

    card.append(emoji, name, streak, actions, checkinBtn, history);
    habitsGrid.appendChild(card);
  });
}

loadHabits();
loadWeatherForecast();
