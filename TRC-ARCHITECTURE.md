# TRC Platform — Full Architecture & Developer Guide
## TARSCO Robotics Club · Ghana

---

## Stack
- **Frontend**: HTML + CSS + Vanilla JS + Tailwind CSS + GSAP
- **Backend**: Node.js + Express
- **Database**: LowDB (JSON file-based)
- **AI**: OpenRouter API (lesson summaries, Q&A assist, badge generation)
- **Deployment**: Termux on Android

---

## File Structure

```
trc-platform/
├── server.js               ← Express entry point
├── db.json                 ← LowDB data store
├── .env                    ← Secrets (JWT_SECRET, OPENROUTER_KEY)
├── package.json
│
├── routes/
│   ├── auth.js             ← Register, login, logout (JWT)
│   ├── users.js            ← User profile, role management
│   ├── membership.js       ← Apply, approve, reject membership
│   ├── learn.js            ← Modules, lessons, progress, streaks
│   ├── quiz.js             ← Quiz questions, submissions, scoring
│   ├── projects.js         ← Project CRUD, submit, approve
│   ├── community.js        ← Posts, replies, upvotes
│   ├── messages.js         ← Direct messaging
│   ├── events.js           ← Events / announcements
│   ├── resources.js        ← Resource uploads and listing
│   ├── gallery.js          ← Gallery images
│   ├── notifications.js    ← Per-user notification feed
│   └── admin.js            ← Admin-only routes (stats, moderation)
│
├── middleware/
│   ├── auth.js             ← verifyToken middleware
│   ├── roles.js            ← requireRole('admin'), requireMember()
│   └── upload.js           ← multer file upload config
│
├── public/                 ← Static HTML pages (served by Express)
│   ├── trc-home.html
│   ├── about.html
│   ├── learn.html
│   ├── lesson.html
│   ├── projects.html
│   ├── project.html
│   ├── events.html
│   ├── resources.html
│   ├── community.html
│   ├── gallery.html
│   ├── join.html
│   ├── contact.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── my-learning.html
│   ├── my-projects.html
│   ├── messages.html
│   ├── profile.html
│   ├── notifications.html
│   ├── quiz.html
│   └── admin/
│       ├── admin.html
│       ├── admin-users.html
│       ├── admin-membership.html
│       ├── admin-lessons.html
│       ├── admin-lesson-new.html
│       ├── admin-projects.html
│       ├── admin-events.html
│       ├── admin-resources.html
│       ├── admin-gallery.html
│       ├── admin-moderation.html
│       └── admin-updates.html
│
└── uploads/                ← User-uploaded files (images, PDFs, etc.)
```

---

## LowDB Schema (db.json)

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Kwame Asante",
      "email": "kwame@tarsco.edu",
      "passwordHash": "bcrypt_hash",
      "role": "student | member | executive | superadmin",
      "joinedAt": "ISO_DATE",
      "avatar": null,
      "bio": "",
      "streak": 7,
      "lastActiveDate": "ISO_DATE",
      "badges": ["circuit-starter", "week-warrior"],
      "totalPoints": 380,
      "suspended": false
    }
  ],

  "membershipApplications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "motivation": "I want to join the competition team...",
      "status": "pending | approved | rejected",
      "appliedAt": "ISO_DATE",
      "reviewedBy": null,
      "reviewedAt": null
    }
  ],

  "modules": [
    {
      "id": "uuid",
      "title": "Basic Electronics",
      "description": "...",
      "level": "beginner | intermediate | advanced",
      "order": 2,
      "published": true,
      "coverEmoji": "⚡",
      "estimatedHours": 4
    }
  ],

  "lessons": [
    {
      "id": "uuid",
      "moduleId": "uuid",
      "title": "Breadboards & Building Your First Circuit",
      "order": 7,
      "published": true,
      "durationMin": 30,
      "content": {
        "objectives": ["..."],
        "materials": ["..."],
        "sections": [
          {
            "type": "text | code | info | image | diagram",
            "heading": "How a Breadboard Works",
            "body": "...",
            "lang": "arduino",
            "code": "void setup() { ... }"
          }
        ]
      }
    }
  ],

  "quizzes": [
    {
      "id": "uuid",
      "lessonId": "uuid",
      "questions": [
        {
          "id": "uuid",
          "text": "What is Ohm's Law?",
          "options": ["V=IR", "V=I+R", "V=I/R", "V=I²R"],
          "correct": 0,
          "explanation": "Ohm's Law states..."
        }
      ]
    }
  ],

  "quizAttempts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "quizId": "uuid",
      "lessonId": "uuid",
      "score": 92,
      "answers": [0, 2, 1, 0],
      "takenAt": "ISO_DATE"
    }
  ],

  "lessonProgress": [
    {
      "id": "uuid",
      "userId": "uuid",
      "lessonId": "uuid",
      "moduleId": "uuid",
      "completed": true,
      "completedAt": "ISO_DATE"
    }
  ],

  "projects": [
    {
      "id": "uuid",
      "title": "Obstacle Avoidance Car",
      "coverImage": "/uploads/projects/oac.jpg",
      "description": "...",
      "problemSolved": "...",
      "materials": ["HC-SR04", "L298N", "Arduino Uno"],
      "circuitDiagram": "/uploads/circuits/oac.png",
      "codeSnippets": ["..."],
      "codeFiles": ["/uploads/code/oac.ino"],
      "teamMembers": ["userId1", "userId2"],
      "gallery": ["/uploads/projects/oac1.jpg"],
      "demoLink": "",
      "buildSteps": ["Step 1: Wire the motors...", "..."],
      "submittedBy": "userId",
      "submittedAt": "ISO_DATE",
      "status": "pending | approved | rejected",
      "approvedBy": null,
      "approvedAt": null,
      "type": "club | member",
      "tags": ["autonomous", "sensors"],
      "year": 2025
    }
  ],

  "communityPosts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "My HC-SR04 reads 0 even when objects are close",
      "body": "...",
      "tags": ["arduino", "sensors", "HC-SR04"],
      "upvotes": ["userId1", "userId2"],
      "status": "open | answered",
      "acceptedReplyId": null,
      "createdAt": "ISO_DATE",
      "flagged": false
    }
  ],

  "communityReplies": [
    {
      "id": "uuid",
      "postId": "uuid",
      "userId": "uuid",
      "body": "Check your Echo pin...",
      "upvotes": ["userId1"],
      "isAccepted": false,
      "createdAt": "ISO_DATE",
      "flagged": false
    }
  ],

  "messages": [
    {
      "id": "uuid",
      "fromUserId": "uuid",
      "toUserId": "uuid",
      "body": "Hey, I have a question about the project...",
      "readAt": null,
      "sentAt": "ISO_DATE"
    }
  ],

  "events": [
    {
      "id": "uuid",
      "title": "Regional Robotics Championship",
      "description": "...",
      "type": "competition | workshop | buildday | talk | announcement",
      "date": "ISO_DATE",
      "time": "09:00",
      "location": "TARSCO Assembly Hall",
      "memberOnly": false,
      "createdBy": "userId",
      "createdAt": "ISO_DATE"
    }
  ],

  "resources": [
    {
      "id": "uuid",
      "title": "Arduino Reference Sheet",
      "description": "...",
      "type": "pdf | code | diagram | image | ebook | link | component-list",
      "file": "/uploads/resources/arduino-ref.pdf",
      "url": null,
      "uploadedBy": "userId",
      "uploadedAt": "ISO_DATE",
      "downloads": 48
    }
  ],

  "gallery": [
    {
      "id": "uuid",
      "title": "Build Day Feb 2025",
      "imageUrl": "/uploads/gallery/buildday-feb.jpg",
      "uploadedBy": "userId",
      "uploadedAt": "ISO_DATE"
    }
  ],

  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "membership_approved | project_approved | reply | upvote | event | system",
      "message": "Your membership application has been approved!",
      "link": "/dashboard.html",
      "read": false,
      "createdAt": "ISO_DATE"
    }
  ],

  "internalUpdates": [
    {
      "id": "uuid",
      "title": "Competition Prep Schedule",
      "body": "...",
      "createdBy": "userId",
      "createdAt": "ISO_DATE",
      "pinned": false
    }
  ],

  "badges": [
    { "id": "first-lesson",    "name": "First Step",       "icon": "👣", "description": "Complete your first lesson" },
    { "id": "circuit-starter", "name": "Circuit Starter",  "icon": "⚡", "description": "Complete Basic Electronics" },
    { "id": "week-warrior",    "name": "Week Warrior",     "icon": "🔥", "description": "Maintain a 7-day streak" },
    { "id": "quiz-ace",        "name": "Quiz Ace",         "icon": "🎯", "description": "Score 100% on any quiz" },
    { "id": "project-builder", "name": "Project Builder",  "icon": "🏗️", "description": "Have a project approved" },
    { "id": "helper",          "name": "Helper",           "icon": "🤝", "description": "Get 10 upvotes on answers" },
    { "id": "competitor",      "name": "Competitor",       "icon": "🏆", "description": "Participate in a competition" }
  ]
}
```

---

## API Routes Reference

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/auth/register | Public | Create student account |
| POST | /api/auth/login | Public | Login, returns JWT |
| POST | /api/auth/logout | Auth | Invalidate session |

### Users
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/users/me | Auth | Get own profile |
| PATCH | /api/users/me | Auth | Update profile |
| GET | /api/users/:id | Auth | View any profile |
| PATCH | /api/users/:id/role | Admin | Change user role |
| POST | /api/users/:id/suspend | Admin | Suspend user |

### Membership
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | /api/membership/apply | Student | Submit application |
| GET | /api/membership/applications | Admin | List all applications |
| PATCH | /api/membership/:id/approve | Admin | Approve → role becomes member |
| PATCH | /api/membership/:id/reject | Admin | Reject application |

### Learn
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/modules | Public | List all published modules |
| GET | /api/modules/:id/lessons | Auth | Lessons in a module |
| GET | /api/lessons/:id | Auth | Single lesson content |
| POST | /api/lessons/:id/complete | Auth | Mark lesson done, update streak |
| GET | /api/progress/me | Auth | My progress across all modules |

### Quizzes
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/quiz/:lessonId | Auth | Get quiz for lesson |
| POST | /api/quiz/:id/submit | Auth | Submit answers, get score |
| GET | /api/quiz/attempts/me | Auth | My quiz history |

### Projects
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/projects | Public | All approved projects |
| GET | /api/projects/:id | Public | Single project |
| POST | /api/projects | Member | Submit project |
| PATCH | /api/projects/:id | Member | Edit own project |
| PATCH | /api/projects/:id/approve | Admin | Publish project |
| PATCH | /api/projects/:id/reject | Admin | Reject project |
| POST | /api/projects/:id/join | Member | Join project team |
| POST | /api/projects/:id/comment | Auth | Comment on project |

### Community
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/posts | Public | List posts |
| GET | /api/posts/:id | Public | Single post + replies |
| POST | /api/posts | Auth | Create post |
| POST | /api/posts/:id/reply | Auth | Reply to post |
| POST | /api/posts/:id/upvote | Auth | Toggle upvote |
| POST | /api/posts/:id/replies/:rid/upvote | Auth | Upvote reply |
| POST | /api/posts/:id/replies/:rid/accept | Auth (OP) | Accept as answer |
| POST | /api/posts/:id/flag | Auth | Flag for moderation |

### Messages
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/messages | Auth | My conversations |
| GET | /api/messages/:userId | Auth | Thread with a user |
| POST | /api/messages/:userId | Auth | Send message |
| PATCH | /api/messages/:id/read | Auth | Mark read |

### Events
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/events | Public | All events |
| POST | /api/events | Admin | Create event |
| PATCH | /api/events/:id | Admin | Edit event |
| DELETE | /api/events/:id | Admin | Delete event |

### Resources
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/resources | Auth | List all resources |
| POST | /api/resources | Admin | Upload resource |
| GET | /api/resources/:id/download | Auth | Download file |
| DELETE | /api/resources/:id | Admin | Remove resource |

### Notifications
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/notifications | Auth | My notifications |
| PATCH | /api/notifications/:id/read | Auth | Mark read |
| POST | /api/notifications/mark-all-read | Auth | Mark all read |

### Admin
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | /api/admin/stats | Admin | Platform overview stats |
| GET | /api/admin/moderation | Admin | Flagged posts/replies |
| POST | /api/admin/moderation/:id/remove | Admin | Remove flagged content |

---

## Role Permissions Matrix

| Action | Student | Member | Executive | Super Admin |
|--------|---------|--------|-----------|-------------|
| Access lessons | ✓ | ✓ | ✓ | ✓ |
| Take quizzes | ✓ | ✓ | ✓ | ✓ |
| Community post | ✓ | ✓ | ✓ | ✓ |
| DM users | ✓ | ✓ | ✓ | ✓ |
| Apply for membership | ✓ | — | — | — |
| Submit projects | — | ✓ | ✓ | ✓ |
| Join project teams | — | ✓ | ✓ | ✓ |
| Internal updates | — | ✓ | ✓ | ✓ |
| Create events | — | — | ✓ | ✓ |
| Approve projects | — | — | ✓ | ✓ |
| Approve membership | — | — | ✓ | ✓ |
| Manage lessons | — | — | ✓ | ✓ |
| Suspend users | — | — | — | ✓ |
| Change user roles | — | — | — | ✓ |
| Full system access | — | — | — | ✓ |

---

## Streak & Badge Logic (server-side)

```js
// On POST /api/lessons/:id/complete
async function completelesson(userId, lessonId) {
  const user = db.get('users').find({ id: userId });
  const today = new Date().toDateString();
  const last  = new Date(user.lastActiveDate).toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (last === today) {
    // already logged today, no streak change
  } else if (last === yesterday) {
    user.streak += 1; // extend streak
  } else {
    user.streak = 1; // reset streak
  }

  user.lastActiveDate = new Date().toISOString();

  // Award badges
  const done = db.get('lessonProgress').filter({ userId, completed: true }).size();
  if (done === 1) awardBadge(userId, 'first-lesson');
  if (user.streak >= 7) awardBadge(userId, 'week-warrior');
  // ...etc
}
```

---

## OpenRouter AI Integration

Used for:
1. **AI study assistant** — "Explain this lesson concept in simpler terms"
2. **Quiz hint generator** — Generate contextual hints per question
3. **Community Q&A assist** — Suggest answers based on lesson content

```js
// routes/ai.js
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.post('/api/ai/explain', verifyToken, async (req, res) => {
  const { concept, lessonId } = req.body;
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful robotics tutor for high school students in Ghana. Keep explanations simple, practical, and encouraging.' },
        { role: 'user', content: `Explain this concept simply: ${concept}` }
      ]
    })
  });
  const data = await response.json();
  res.json({ explanation: data.choices[0].message.content });
});
```

---

## Startup (Termux)

```bash
# Install
pkg install nodejs
npm install

# .env
echo "JWT_SECRET=your_secret_here" > .env
echo "OPENROUTER_KEY=sk-or-..." >> .env
echo "PORT=3000" >> .env

# Run
node server.js

# Or with auto-restart
npm install -g pm2
pm2 start server.js --name trc
pm2 save
```

---

## Pages Delivery Order (Recommended Build Sequence)

1. ✅ trc-home.html — Landing / public home
2. ✅ dashboard.html — Student dashboard
3. ✅ lesson.html — Lesson viewer
4. ✅ admin.html — Admin control panel
5. ✅ community.html — Q&A forum
6. 🔲 login.html + signup.html
7. 🔲 learn.html — Module browser
8. 🔲 my-learning.html — Progress tracker
9. 🔲 projects.html — Project gallery
10. 🔲 project.html — Single project page
11. 🔲 messages.html — DM chat interface
12. 🔲 quiz.html — Quiz player
13. 🔲 profile.html
14. 🔲 resources.html
15. 🔲 events.html
16. 🔲 notifications.html
17. 🔲 gallery.html
18. 🔲 join.html + about.html + contact.html
19. 🔲 admin sub-pages (lesson editor, moderation, etc.)
```
