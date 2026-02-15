# Habit Tracker — VS Code Learning App

A colourful, playful habit tracker with a built-in task guide that teaches you how to edit HTML, CSS, and JavaScript.

## Two Apps in One

1. **The Habit Tracker** — A real, working habit tracker at [http://localhost:3005](http://localhost:3005)
2. **The Task Guide** — A companion learning app at [http://localhost:3005/guide](http://localhost:3005/guide) with 8 tasks that teach you to edit the code

## How to Run

```bash
npm install
npm start
```

Then open [http://localhost:3005](http://localhost:3005) in your browser.

## Features

- Add habits with custom name, emoji, and colour
- Check in daily to build streaks
- Streak tracking with fire emoji
- SQLite database for persistence
- 8 guided learning tasks to teach code editing

## Tech Stack

- **Backend:** Node.js, Express, better-sqlite3
- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Database:** SQLite (auto-created in data/ folder)
