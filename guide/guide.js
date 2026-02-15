// ════════════════════════════════════════════════════════════
// ── guide.js — Task Guide Frontend Logic ───────────────────
// This file handles the Task Guide app: rendering the task
// list in the sidebar, showing task details, running checks,
// and tracking which tasks are completed.
// ════════════════════════════════════════════════════════════

// ── Task Definitions ───────────────────────────────────────
// Each task has a number, title, file to edit, instructions,
// a hint, and whether it's auto-checked or self-checked.
const tasks = [
  {
    number: 1,
    title: 'Change the page background colour',
    type: 'CSS — auto-check',
    file: 'public/style.css',
    instructions: `
      <p>Open <code>public/style.css</code> in VS Code.</p>
      <p>Find the <code>:root</code> section at the very top of the file. This is where all the design variables are defined.</p>
      <p>Look for the line that says <code>--bg-page: #f8f9ff;</code></p>
      <p>Change <code>#f8f9ff</code> to any colour you like! Try <code>#ffe8e8</code> for pink, <code>#e8ffe8</code> for green, or <code>#fff5e0</code> for warm yellow.</p>
      <p>Save the file and refresh your browser to see the change.</p>
    `,
    hint: 'Hex colours start with # followed by 6 characters (0-9 and a-f). Google "hex colour picker" to find the perfect colour!',
    autoCheck: true
  },
  {
    number: 2,
    title: 'Make the cards more rounded',
    type: 'CSS — auto-check',
    file: 'public/style.css',
    instructions: `
      <p>Open <code>public/style.css</code> and find the <code>:root</code> section.</p>
      <p>Look for <code>--card-radius: 20px;</code></p>
      <p>Change <code>20px</code> to a bigger number. Try <code>32px</code> or even <code>40px</code> for super-rounded cards!</p>
      <p>The bigger the number, the more rounded the corners. Save and refresh to see the effect.</p>
    `,
    hint: 'Border radius is measured in pixels (px). 0px = sharp corners, 50px = very round. Try different values to see what you like!',
    autoCheck: true
  },
  {
    number: 3,
    title: 'Change the page font',
    type: 'CSS — self-check',
    file: 'public/style.css + public/index.html',
    instructions: `
      <p>This task has two steps:</p>
      <p><strong>Step 1:</strong> Go to <a href="https://fonts.google.com" target="_blank">fonts.google.com</a> and pick a font you like. Try "Nunito", "Fredoka One", or "Comic Neue".</p>
      <p><strong>Step 2:</strong> Open <code>public/index.html</code>. Find the Google Fonts <code>&lt;link&gt;</code> tag in the <code>&lt;head&gt;</code>. Change "Poppins" in the URL to your chosen font name.</p>
      <p><strong>Step 3:</strong> Open <code>public/style.css</code>. In the <code>:root</code> section, change <code>--font-main</code> from <code>'Poppins'</code> to your new font name (keep the quotes!).</p>
      <p>Save both files and refresh.</p>
    `,
    hint: 'Make sure the font name in the CSS matches exactly what Google Fonts shows. If the font name has spaces (like "Fredoka One"), keep it in quotes.',
    autoCheck: false
  },
  {
    number: 4,
    title: 'Add a page title above the habit grid',
    type: 'HTML — auto-check',
    file: 'public/index.html',
    instructions: `
      <p>Open <code>public/index.html</code> in VS Code.</p>
      <p>Find the comment that says <code>&lt;!-- Habit Cards Grid --&gt;</code></p>
      <p>Just <strong>above</strong> the <code>&lt;div class="habits-grid"&gt;</code> line, add this:</p>
      <p><code>&lt;h2&gt;My Daily Habits&lt;/h2&gt;</code></p>
      <p>Save and refresh. You should see "My Daily Habits" as a heading above your habit cards.</p>
    `,
    hint: 'The <h2> tag creates a medium-sized heading. Make sure you type it exactly: <h2>My Daily Habits</h2> — with capital letters matching!',
    autoCheck: true
  },
  {
    number: 5,
    title: 'Add a footer to the page',
    type: 'HTML — auto-check',
    file: 'public/index.html',
    instructions: `
      <p>Open <code>public/index.html</code>.</p>
      <p>Find the closing <code>&lt;/div&gt;</code> of the main <code>.app</code> container (it's near the bottom of the body).</p>
      <p>Just <strong>before</strong> that closing <code>&lt;/div&gt;</code>, add a footer element:</p>
      <p><code>&lt;footer&gt;Built by Jonathan 🚀&lt;/footer&gt;</code></p>
      <p>You can write any text you want inside the footer!</p>
    `,
    hint: 'A <footer> is just like any other HTML tag. It goes inside the .app div, at the very end, before the closing </div>.',
    autoCheck: true
  },
  {
    number: 6,
    title: 'Change the check-in button colour',
    type: 'CSS — auto-check',
    file: 'public/style.css',
    instructions: `
      <p>Open <code>public/style.css</code> and find the <code>:root</code> section.</p>
      <p>Look for <code>--colour-done: #4ecb71;</code></p>
      <p>This controls the colour of the "Check In" button. Change it to any colour!</p>
      <p>Try <code>#6c8cff</code> for blue, <code>#f0c040</code> for gold, or <code>#e056a0</code> for pink.</p>
      <p>Save and refresh to see your new button colour.</p>
    `,
    hint: 'This variable only changes the check-in button colour. The "Done" state always turns grey. Try a colour that\'s bright and satisfying to click!',
    autoCheck: true
  },
  {
    number: 7,
    title: 'Make the empty state message funnier',
    type: 'JavaScript — self-check',
    file: 'public/app.js',
    instructions: `
      <p>Open <code>public/app.js</code> in VS Code.</p>
      <p>Find the <code>renderHabits()</code> function. Look for the empty state section — it's the part that shows when there are no habits yet.</p>
      <p>You'll see text like "No habits yet!" and "Click + New Habit to start tracking".</p>
      <p>Change these to something funnier! For example:</p>
      <p>"Your habit garden is empty... time to plant some seeds! 🌱"</p>
      <p>Be creative — make it your own message!</p>
    `,
    hint: 'Look for the section with class="empty-state" inside the renderHabits function. You can change the emoji, the heading, and the paragraph text.',
    autoCheck: false
  },
  {
    number: 8,
    title: 'Add a second emoji to the streak display',
    type: 'JavaScript — self-check',
    file: 'public/app.js',
    instructions: `
      <p>Open <code>public/app.js</code> and find the <code>renderHabits()</code> function.</p>
      <p>Look for where the streak counter is built. You'll see the 🔥 emoji followed by the streak number.</p>
      <p>Add a second emoji after the streak number. For example, change:</p>
      <p><code>🔥 3 days</code> → <code>🔥 3 days ⚡</code></p>
      <p>Try emojis like ⚡, 💪, 🏆, or 🎯</p>
    `,
    hint: 'Find the line with the 🔥 emoji in the template string. Add your chosen emoji after the "days" text. Emojis can be copied from emojipedia.org.',
    autoCheck: false
  }
];

// ── State ──────────────────────────────────────────────────
// Track which task is selected and which are completed.
// Completed tasks are saved in localStorage so they persist
// between page refreshes.
let currentTask = null;
const completedTasks = JSON.parse(localStorage.getItem('guide-completed') || '[]');

// ── DOM References ─────────────────────────────────────────
const taskListEl = document.getElementById('task-list');
const mainPanelEl = document.getElementById('main-panel');
const welcomeEl = document.getElementById('welcome-message');
const detailEl = document.getElementById('task-detail');
const taskBadgeEl = document.getElementById('task-badge');
const taskTitleEl = document.getElementById('task-title');
const taskFileEl = document.getElementById('task-file');
const taskInstructionsEl = document.getElementById('task-instructions');
const taskHintEl = document.getElementById('task-hint');
const taskResultEl = document.getElementById('task-result');
const checkBtn = document.getElementById('check-btn');
const hintBtn = document.getElementById('hint-btn');

// ── renderTaskList() ───────────────────────────────────────
// Builds the sidebar list of all 8 tasks. Each task shows
// its number, title, and a checkmark if completed.
function renderTaskList() {
  taskListEl.innerHTML = tasks.map(task => {
    const isCompleted = completedTasks.includes(task.number);
    const isActive = currentTask && currentTask.number === task.number;

    return `
      <div class="task-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
           onclick="selectTask(${task.number})">
        <div class="task-item-number">${isCompleted ? '✓' : task.number}</div>
        <div class="task-item-title">${task.title}</div>
        ${isCompleted ? '<span class="task-item-check">✓</span>' : ''}
      </div>
    `;
  }).join('');
}

// ── selectTask(number) ─────────────────────────────────────
// Called when the user clicks a task in the sidebar.
// Shows that task's full details in the main panel.
function selectTask(number) {
  currentTask = tasks.find(t => t.number === number);
  if (!currentTask) return;

  // Show detail view, hide welcome
  welcomeEl.style.display = 'none';
  detailEl.style.display = 'block';

  // Fill in the task details
  taskBadgeEl.textContent = 'Task ' + currentTask.number;
  taskTitleEl.textContent = currentTask.title;
  taskFileEl.innerHTML = `<span class="file-badge">${currentTask.file}</span>  <span style="color: var(--guide-text-light); font-size: 0.85rem;">${currentTask.type}</span>`;
  taskInstructionsEl.innerHTML = currentTask.instructions;

  // Reset hint and result
  taskHintEl.style.display = 'none';
  taskHintEl.textContent = currentTask.hint;
  taskResultEl.style.display = 'none';

  // Update button text based on task type
  if (currentTask.autoCheck) {
    checkBtn.textContent = 'Check My Work';
  } else {
    checkBtn.textContent = "I've Done It!";
  }

  // Re-render sidebar to update active state
  renderTaskList();
}

// ── Check Button Handler ───────────────────────────────────
// For auto-check tasks: calls the server API to verify.
// For self-check tasks: marks as complete immediately.
checkBtn.addEventListener('click', async () => {
  if (!currentTask) return;

  if (currentTask.autoCheck) {
    // Call the server to check
    try {
      const response = await fetch(`/api/guide/check/${currentTask.number}`);
      const result = await response.json();

      taskResultEl.style.display = 'block';
      if (result.passed) {
        taskResultEl.className = 'task-result success';
        taskResultEl.textContent = result.message;
        markCompleted(currentTask.number);
      } else {
        taskResultEl.className = 'task-result failure';
        taskResultEl.textContent = result.message;
      }
    } catch (err) {
      taskResultEl.style.display = 'block';
      taskResultEl.className = 'task-result failure';
      taskResultEl.textContent = 'Could not connect to the server. Is it running?';
    }
  } else {
    // Self-check — mark as done
    taskResultEl.style.display = 'block';
    taskResultEl.className = 'task-result success';
    taskResultEl.textContent = 'Great job! Task marked as complete. If it doesn\'t look right in the browser, keep tweaking!';
    markCompleted(currentTask.number);
  }
});

// ── Hint Button Handler ────────────────────────────────────
// Toggles the hint box visibility for the current task.
hintBtn.addEventListener('click', () => {
  if (taskHintEl.style.display === 'none') {
    taskHintEl.style.display = 'block';
    hintBtn.textContent = 'Hide Hint';
  } else {
    taskHintEl.style.display = 'none';
    hintBtn.textContent = 'Show Hint';
  }
});

// ── markCompleted(number) ──────────────────────────────────
// Saves a task as completed in localStorage and re-renders
// the sidebar to show the green checkmark.
function markCompleted(number) {
  if (!completedTasks.includes(number)) {
    completedTasks.push(number);
    localStorage.setItem('guide-completed', JSON.stringify(completedTasks));
    renderTaskList();
  }
}

// ── Initial Render ─────────────────────────────────────────
// Draw the sidebar task list when the page first loads.
renderTaskList();
