# TRC — TARSCO Robotics Club Platform

A full-stack robotics club platform: structured learning paths, project showcase with approval workflow, community Q&A, direct messaging, club membership system, and an admin control panel.

**Stack:** HTML · CSS · Vanilla JS · Tailwind CSS · GSAP · Node.js · Express · LowDB · OpenRouter

---

## Quickstart (Termux on Android)

```bash
# 1. Install Node.js in Termux
pkg update && pkg install nodejs git -y

# 2. Get the project onto the device, then cd into it
cd trc-platform

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
nano .env   # set JWT_SECRET and OPENROUTER_KEY

# 5. Seed demo data (modules, lessons, a quiz, events)
node setup.js

# 6. Start the server
npm start
```

Visit `http://localhost:3000/trc-home.html` in your phone's browser.

**Default admin login:** `admin@tarsco.edu` / `admin123` — change this immediately after first login via the Settings tab.

---

## Project Structure

```
trc-platform/
├── server.js              ← Express app, all API routes
├── setup.js                ← Seeds demo modules/lessons/events
├── package.json
├── .env.example             ← Copy to .env and fill in secrets
├── db.json                  ← LowDB data store (auto-created on first run)
│
├── public/                  ← All frontend pages (move *.html here)
│   ├── trc-home.html         Public landing page
│   ├── login.html            Login + Signup (combined, tabbed)
│   ├── dashboard.html        Student dashboard
│   ├── learn.html            Module browser / learning path
│   ├── lesson.html           Individual lesson viewer
│   ├── quiz.html             Quiz player with timer & scoring
│   ├── projects.html         Project gallery with filters
│   ├── project.html          Single project detail page
│   ├── community.html        Q&A forum
│   ├── messages.html         Direct messaging (chat UI)
│   ├── notifications.html    Notification feed
│   ├── profile.html          User profile + settings
│   ├── resources.html        Resource library (PDFs, code, diagrams)
│   ├── events.html           Events & announcements with countdown
│   ├── join.html             Join / About / Contact (tabbed)
│   └── admin.html            Full admin control panel
│
└── uploads/                  ← Auto-created. User-uploaded files land here.
```

> **Note:** Move every `.html` file into a `public/` folder before running `npm start` — `server.js` is configured to serve static files from `public/`.

---

## What's Built vs What's Wired

This delivery includes:

1. **Complete, polished frontend** for every core page — fully responsive, GSAP-animated, dark cyberpunk/circuit aesthetic, all interactive (filters, tabs, forms, fake-but-working chat, quiz logic, countdown timers, etc.)
2. **Complete Express + LowDB backend** (`server.js`) with every route described in the architecture doc: auth, users, membership, modules/lessons, quizzes, projects, community, messages, events, resources, notifications, admin stats.
3. **Seed script** to populate demo content so the platform isn't empty.

**What still needs wiring for full production use:**
- Connect each frontend page's `fetch()` calls to the real API endpoints (most pages currently render with realistic dummy data + `localStorage` for the login token — replace dummy arrays with `fetch('/api/...')` calls).
- Build out the remaining admin sub-pages (lesson editor with a rich content builder, gallery manager, moderation queue UI) — `admin.html` currently handles these via tabs but a dedicated lesson *editor* (not just list) is the next priority.
- Add the OpenRouter-powered AI study assistant endpoint usage in `lesson.html` (the backend route pattern is documented in the architecture file).
- Add file upload UI (drag-and-drop) wired to the `multer` endpoints already built in `server.js` for resources and gallery.

---

## Role System Quick Reference

| Role | Can do |
|---|---|
| **Student** | Learn, quiz, community post, DM, apply for membership |
| **Member** | + Submit projects, join project teams, internal updates |
| **Executive** | + Approve memberships/projects, manage lessons/events, moderate |
| **Super Admin** | + Change roles, suspend users, full system access |

---

## Key Design Decisions

- **Visual identity:** forest green (`#071B11`) with warm gold (`#E8BE16`), supporting green and clean white accents. The shared brand layer lives in `public/assets/trc-brand.css`; the supplied TRC roundel and school crest are in `public/assets/`. Display typography uses `Rajdhani`, with `Inter` for body copy and `JetBrains Mono` for technical labels.
- **Brand message:** Innovate. Build. Inspire. The visual system follows the supplied TARSCO Robotics Club crest and its 2009 establishment date.
- **LowDB over a real DB:** matches the deployment target (Termux/Android, no persistent server infra) and keeps the whole stack copy-paste portable.
- **Streak & badge logic lives server-side** (`server.js` → `updateStreak()`, `awardBadge()`) so it can't be gamed from the client.
- **Membership is a separate approval flow from registration** — any student can sign up instantly; only admins can promote to `member`.

---

## Next Steps Checklist

- [ ] Move all `.html` files into `/public`
- [ ] Run `npm install && node setup.js && npm start`
- [ ] Change default admin password
- [ ] Wire frontend `fetch()` calls to live API (replace dummy data)
- [ ] Build admin lesson content editor (rich sections: text/code/image/quiz)
- [ ] Add OpenRouter AI assistant button in lesson.html
- [ ] Add drag-and-drop file upload for resources/gallery (admin)
- [ ] Test full membership flow: signup → apply → admin approve → role change
- [ ] Test full project flow: member submit → admin approve → public project page
- [ ] Deploy via `pm2` for persistence on Termux
