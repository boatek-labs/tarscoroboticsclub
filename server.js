/**
 * TRC Platform — Node.js/Express Backend
 * TARSCO Robotics Club · Ghana
 * Stack: Express + LowDB + JWT + Multer
 * Deploy: Termux on Android
 */

const express     = require('express');
const { Low }     = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
const { v4: uuid } = require('uuid');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'trc_secret_change_this';

// ──────────────────────────────
// DB SETUP
// ──────────────────────────────
const adapter = new JSONFile('db.json');
const db = new Low(adapter, {
  users: [],
  membershipApplications: [],
  modules: [],
  lessons: [],
  quizzes: [],
  quizAttempts: [],
  lessonProgress: [],
  projects: [],
  projectComments: [],
  communityPosts: [],
  communityReplies: [],
  messages: [],
  events: [],
  resources: [],
  gallery: [],
  notifications: [],
  internalUpdates: [],
  badges: [
    { id:'first-lesson',    name:'First Step',       icon:'👣', description:'Complete your first lesson' },
    { id:'circuit-starter', name:'Circuit Starter',  icon:'⚡', description:'Complete Basic Electronics module' },
    { id:'week-warrior',    name:'Week Warrior',     icon:'🔥', description:'Maintain a 7-day streak' },
    { id:'quiz-ace',        name:'Quiz Ace',         icon:'🎯', description:'Score 90%+ on any quiz' },
    { id:'project-builder', name:'Project Builder',  icon:'🏗️', description:'Have a project approved' },
    { id:'helper',          name:'Helpful',          icon:'🤝', description:'Get 10 upvotes on answers' },
    { id:'competitor',      name:'Competitor',       icon:'🏆', description:'Participate in a competition' },
    { id:'dedicated',       name:'Dedicated Learner',icon:'📅', description:'Maintain a 14-day streak' },
    { id:'module-master',   name:'Module Master',    icon:'🎓', description:'Complete all modules' },
  ]
});

async function initDB() {
  await db.read();

  const defaults = {
    users: [], membershipApplications: [], modules: [], lessons: [],
    quizzes: [], quizAttempts: [], lessonProgress: [], projects: [],
    projectComments: [], communityPosts: [], communityReplies: [],
    messages: [], events: [], resources: [], gallery: [],
    notifications: [], internalUpdates: [],
    badges: [
      { id:'first-lesson',    name:'First Step',       icon:'👣', description:'Complete your first lesson' },
      { id:'circuit-starter', name:'Circuit Starter',  icon:'⚡', description:'Complete Basic Electronics module' },
      { id:'week-warrior',    name:'Week Warrior',     icon:'🔥', description:'Maintain a 7-day streak' },
      { id:'quiz-ace',        name:'Quiz Ace',         icon:'🎯', description:'Score 90%+ on any quiz' },
      { id:'project-builder', name:'Project Builder',  icon:'🏗️', description:'Have a project approved' },
      { id:'helper',          name:'Helpful',          icon:'🤝', description:'Get 10 upvotes on answers' },
      { id:'competitor',      name:'Competitor',       icon:'🏆', description:'Participate in a competition' },
      { id:'dedicated',       name:'Dedicated Learner',icon:'📅', description:'Maintain a 14-day streak' },
      { id:'module-master',   name:'Module Master',    icon:'🎓', description:'Complete all modules' },
    ]
  };

  // db.data can be null/undefined on a brand-new db.json — apply defaults safely
  db.data = db.data && Object.keys(db.data).length ? db.data : defaults;
  for (const key of Object.keys(defaults)) {
    if (!db.data[key]) db.data[key] = defaults[key];
  }
  await db.write();

  // Seed super admin if no users exist
  if (!db.data.users.length) {
    const hash = await bcrypt.hash('admin123', 10);
    db.data.users.push({
      id: uuid(), name: 'TRC Admin', email: 'admin@tarsco.edu',
      passwordHash: hash, role: 'superadmin',
      joinedAt: new Date().toISOString(), streak: 0,
      lastActiveDate: null, badges: [], totalPoints: 0, suspended: false
    });
    await db.write();
    console.log('✓ Seeded default super admin — admin@tarsco.edu / admin123');
  }
}

// ──────────────────────────────
// MIDDLEWARE
// ──────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Uploads dir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.uploadSubdir || 'misc';
    const dir = path.join(uploadsDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${uuid().slice(0,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Auth middleware
function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
}

// Role middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden — insufficient role' });
    }
    next();
  };
}

const isAdmin = requireRole('superadmin', 'executive');
const isMember = requireRole('superadmin', 'executive', 'member');

// ──────────────────────────────
// HELPERS
// ──────────────────────────────
function safeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

function createNotification(userId, type, message, link = '/notifications.html') {
  db.data.notifications.push({
    id: uuid(), userId, type, message, link,
    read: false, createdAt: new Date().toISOString()
  });
}

async function awardBadge(userId, badgeId) {
  const user = db.data.users.find(u => u.id === userId);
  if (!user || user.badges.includes(badgeId)) return;
  user.badges.push(badgeId);
  user.totalPoints = (user.totalPoints || 0) + 50;
  const badge = db.data.badges.find(b => b.id === badgeId);
  createNotification(userId, 'badge', `Badge earned: ${badge?.name || badgeId} ${badge?.icon || '🏅'}`);
  await db.write();
}

async function updateStreak(userId) {
  const user = db.data.users.find(u => u.id === userId);
  if (!user) return;

  const today     = new Date().toDateString();
  const last      = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (last === today) return; // already counted today

  if (last === yesterday) {
    user.streak = (user.streak || 0) + 1;
  } else {
    user.streak = 1; // reset
  }
  user.lastActiveDate = new Date().toISOString();

  if (user.streak >= 7)  await awardBadge(userId, 'week-warrior');
  if (user.streak >= 14) await awardBadge(userId, 'dedicated');
  await db.write();
}

// ──────────────────────────────
// AUTH ROUTES
// ──────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  await db.read();
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 8)
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (db.data.users.find(u => u.email === email))
    return res.status(409).json({ message: 'An account with this email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuid(), name, email, passwordHash, role: 'student',
    joinedAt: new Date().toISOString(), streak: 0,
    lastActiveDate: null, badges: [], totalPoints: 0,
    bio: '', suspended: false
  };
  db.data.users.push(user);
  createNotification(user.id, 'system', 'Welcome to TRC! Start with Introduction to Robotics.', '/learn.html');
  await db.write();

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: safeUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  await db.read();
  const { email, password } = req.body;
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  if (user.suspended) return res.status(403).json({ message: 'Account suspended. Contact admin.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: safeUser(user) });
});

// ──────────────────────────────
// USER ROUTES
// ──────────────────────────────
app.get('/api/users/me', verifyToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(safeUser(user));
});

app.patch('/api/users/me', verifyToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, bio } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  await db.write();
  res.json(safeUser(user));
});

app.get('/api/users/:id', verifyToken, async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(safeUser(user));
});

app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  res.json(db.data.users.map(safeUser));
});

app.patch('/api/admin/users/:id/role', verifyToken, requireRole('superadmin'), async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const allowed = ['student','member','executive','superadmin'];
  if (!allowed.includes(req.body.role)) return res.status(400).json({ message: 'Invalid role' });
  user.role = req.body.role;
  await db.write();
  res.json(safeUser(user));
});

app.post('/api/admin/users/:id/suspend', verifyToken, requireRole('superadmin'), async (req, res) => {
  await db.read();
  const user = db.data.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.suspended = !user.suspended;
  await db.write();
  res.json({ suspended: user.suspended });
});

// ──────────────────────────────
// MEMBERSHIP
// ──────────────────────────────
app.post('/api/membership/apply', verifyToken, async (req, res) => {
  await db.read();
  const existing = db.data.membershipApplications.find(
    a => a.userId === req.user.id && a.status === 'pending'
  );
  if (existing) return res.status(409).json({ message: 'You already have a pending application' });

  const app_ = {
    id: uuid(), userId: req.user.id,
    motivation: req.body.motivation || '',
    status: 'pending',
    appliedAt: new Date().toISOString(),
    reviewedBy: null, reviewedAt: null
  };
  db.data.membershipApplications.push(app_);
  // Notify admins
  db.data.users.filter(u => ['superadmin','executive'].includes(u.role)).forEach(admin => {
    createNotification(admin.id, 'membership', `New membership application from ${req.user.name || 'a student'}`, '/admin.html');
  });
  await db.write();
  res.status(201).json(app_);
});

app.get('/api/membership/applications', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const apps = db.data.membershipApplications.map(a => ({
    ...a,
    user: safeUser(db.data.users.find(u => u.id === a.userId) || {})
  }));
  res.json(apps);
});

app.patch('/api/membership/:id/approve', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const app_ = db.data.membershipApplications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ message: 'Application not found' });
  app_.status    = 'approved';
  app_.reviewedBy = req.user.id;
  app_.reviewedAt = new Date().toISOString();

  const user = db.data.users.find(u => u.id === app_.userId);
  if (user) {
    user.role = 'member';
    createNotification(user.id, 'membership_approved',
      '🎉 Your club membership has been approved! Welcome to TRC.',
      '/dashboard.html');
  }
  await db.write();
  res.json({ success: true });
});

app.patch('/api/membership/:id/reject', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const app_ = db.data.membershipApplications.find(a => a.id === req.params.id);
  if (!app_) return res.status(404).json({ message: 'Application not found' });
  app_.status    = 'rejected';
  app_.reviewedBy = req.user.id;
  app_.reviewedAt = new Date().toISOString();

  const user = db.data.users.find(u => u.id === app_.userId);
  if (user) {
    createNotification(user.id, 'membership_rejected',
      'Your membership application was not approved this time. You may reapply after completing more modules.',
      '/join.html');
  }
  await db.write();
  res.json({ success: true });
});

// ──────────────────────────────
// LEARN — MODULES & LESSONS
// ──────────────────────────────
app.get('/api/modules', async (req, res) => {
  await db.read();
  res.json(db.data.modules.filter(m => m.published).sort((a,b) => a.order - b.order));
});

app.get('/api/modules/:id/lessons', verifyToken, async (req, res) => {
  await db.read();
  const lessons = db.data.lessons
    .filter(l => l.moduleId === req.params.id && l.published)
    .sort((a,b) => a.order - b.order);
  // Inject progress
  const progress = db.data.lessonProgress.filter(p => p.userId === req.user.id);
  const withProgress = lessons.map(l => ({
    ...l,
    completed: !!progress.find(p => p.lessonId === l.id && p.completed)
  }));
  res.json(withProgress);
});

app.get('/api/lessons/:id', verifyToken, async (req, res) => {
  await db.read();
  const lesson = db.data.lessons.find(l => l.id === req.params.id && l.published);
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
  const progress = db.data.lessonProgress.find(
    p => p.userId === req.user.id && p.lessonId === lesson.id
  );
  res.json({ ...lesson, completed: !!progress?.completed });
});

app.post('/api/lessons/:id/complete', verifyToken, async (req, res) => {
  await db.read();
  const lesson = db.data.lessons.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

  let progress = db.data.lessonProgress.find(
    p => p.userId === req.user.id && p.lessonId === lesson.id
  );
  if (!progress) {
    progress = { id: uuid(), userId: req.user.id, lessonId: lesson.id,
                 moduleId: lesson.moduleId, completed: true,
                 completedAt: new Date().toISOString() };
    db.data.lessonProgress.push(progress);
  } else {
    progress.completed   = true;
    progress.completedAt = new Date().toISOString();
  }

  await updateStreak(req.user.id);

  // Badges
  const doneLessons = db.data.lessonProgress.filter(
    p => p.userId === req.user.id && p.completed
  ).length;
  if (doneLessons === 1) await awardBadge(req.user.id, 'first-lesson');

  // Award points
  const user = db.data.users.find(u => u.id === req.user.id);
  if (user) user.totalPoints = (user.totalPoints || 0) + 10;

  await db.write();
  res.json({ success: true, progress });
});

app.get('/api/progress/me', verifyToken, async (req, res) => {
  await db.read();
  const progress = db.data.lessonProgress.filter(
    p => p.userId === req.user.id && p.completed
  );
  const user = db.data.users.find(u => u.id === req.user.id);
  res.json({
    completedLessons: progress.length,
    streak: user?.streak || 0,
    badges: user?.badges || [],
    totalPoints: user?.totalPoints || 0,
    byModule: progress.reduce((acc, p) => {
      acc[p.moduleId] = (acc[p.moduleId] || 0) + 1;
      return acc;
    }, {})
  });
});

// Admin: lesson management
app.post('/api/lessons', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const lesson = { id: uuid(), ...req.body, published: false, createdAt: new Date().toISOString() };
  db.data.lessons.push(lesson);
  await db.write();
  res.status(201).json(lesson);
});

app.patch('/api/lessons/:id', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const lesson = db.data.lessons.find(l => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
  Object.assign(lesson, req.body);
  await db.write();
  res.json(lesson);
});

// ──────────────────────────────
// QUIZZES
// ──────────────────────────────
app.get('/api/quiz/:lessonId', verifyToken, async (req, res) => {
  await db.read();
  const quiz = db.data.quizzes.find(q => q.lessonId === req.params.lessonId);
  if (!quiz) return res.status(404).json({ message: 'No quiz for this lesson' });
  // Strip correct answers before sending
  const safe = { ...quiz, questions: quiz.questions.map(({ correct, explanation, ...q }) => q) };
  res.json(safe);
});

app.post('/api/quiz/:id/submit', verifyToken, async (req, res) => {
  await db.read();
  const quiz = db.data.quizzes.find(q => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const { answers } = req.body; // array of answer indices
  let correct = 0;
  const results = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correct;
    if (isCorrect) correct++;
    return { isCorrect, correct: q.correct, explanation: q.explanation };
  });

  const score = Math.round((correct / quiz.questions.length) * 100);

  const attempt = {
    id: uuid(), userId: req.user.id, quizId: quiz.id,
    lessonId: quiz.lessonId, score, answers,
    takenAt: new Date().toISOString()
  };
  db.data.quizAttempts.push(attempt);

  if (score >= 90) await awardBadge(req.user.id, 'quiz-ace');

  // Points
  const user = db.data.users.find(u => u.id === req.user.id);
  if (user) user.totalPoints = (user.totalPoints || 0) + Math.floor(score / 10) * 5;

  await db.write();
  res.json({ score, correct, total: quiz.questions.length, results, attempt });
});

// ──────────────────────────────
// PROJECTS
// ──────────────────────────────
app.get('/api/projects', async (req, res) => {
  await db.read();
  let projects = db.data.projects.filter(p => p.status === 'approved');
  if (req.query.tag) projects = projects.filter(p => p.tags?.includes(req.query.tag));
  res.json(projects);
});

app.get('/api/projects/:id', async (req, res) => {
  await db.read();
  const project = db.data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

app.post('/api/projects', verifyToken, isMember, async (req, res) => {
  await db.read();
  const project = {
    id: uuid(), ...req.body,
    submittedBy: req.user.id,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    teamMembers: [req.user.id]
  };
  db.data.projects.push(project);
  // Notify admins
  db.data.users.filter(u => ['superadmin','executive'].includes(u.role)).forEach(admin => {
    createNotification(admin.id, 'project', `New project submission: "${project.title}"`, '/admin.html');
  });
  await db.write();
  res.status(201).json(project);
});

app.patch('/api/projects/:id/approve', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const project = db.data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  project.status     = 'approved';
  project.approvedBy = req.user.id;
  project.approvedAt = new Date().toISOString();
  // Notify submitter
  createNotification(project.submittedBy, 'project_approved',
    `🎉 Your project "${project.title}" has been approved and is now public!`,
    `/project.html?id=${project.id}`);
  await awardBadge(project.submittedBy, 'project-builder');
  await db.write();
  res.json({ success: true });
});

app.patch('/api/projects/:id/reject', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const project = db.data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  project.status     = 'rejected';
  project.rejectedBy = req.user.id;
  project.rejectedAt = new Date().toISOString();
  project.rejectReason = req.body.reason || '';
  createNotification(project.submittedBy, 'project_rejected',
    `Your project "${project.title}" was not approved. ${req.body.reason || 'Please review and resubmit.'}`,
    '/my-projects.html');
  await db.write();
  res.json({ success: true });
});

app.post('/api/projects/:id/join', verifyToken, isMember, async (req, res) => {
  await db.read();
  const project = db.data.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!project.teamMembers.includes(req.user.id)) {
    project.teamMembers.push(req.user.id);
    await db.write();
  }
  res.json({ success: true });
});

app.post('/api/projects/:id/comment', verifyToken, async (req, res) => {
  await db.read();
  const comment = {
    id: uuid(), projectId: req.params.id,
    userId: req.user.id, body: req.body.body,
    createdAt: new Date().toISOString()
  };
  db.data.projectComments = db.data.projectComments || [];
  db.data.projectComments.push(comment);
  await db.write();
  res.status(201).json(comment);
});

// ──────────────────────────────
// COMMUNITY
// ──────────────────────────────
app.get('/api/posts', async (req, res) => {
  await db.read();
  let posts = db.data.communityPosts.filter(p => !p.flagged);
  const { sort, tag } = req.query;
  if (tag) posts = posts.filter(p => p.tags?.includes(tag));
  if (sort === 'top')        posts.sort((a,b) => b.upvotes.length - a.upvotes.length);
  else if (sort === 'unanswered') posts = posts.filter(p => p.status === 'open');
  else if (sort === 'answered')   posts = posts.filter(p => p.status === 'answered');
  else posts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.get('/api/posts/:id', async (req, res) => {
  await db.read();
  const post = db.data.communityPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const replies = db.data.communityReplies.filter(r => r.postId === req.params.id && !r.flagged);
  res.json({ ...post, replies });
});

app.post('/api/posts', verifyToken, async (req, res) => {
  await db.read();
  const post = {
    id: uuid(), userId: req.user.id,
    title: req.body.title, body: req.body.body,
    tags: req.body.tags || [], upvotes: [],
    status: 'open', acceptedReplyId: null,
    createdAt: new Date().toISOString(), flagged: false
  };
  db.data.communityPosts.push(post);
  await db.write();
  res.status(201).json(post);
});

app.post('/api/posts/:id/reply', verifyToken, async (req, res) => {
  await db.read();
  const post = db.data.communityPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const reply = {
    id: uuid(), postId: req.params.id,
    userId: req.user.id, body: req.body.body,
    upvotes: [], isAccepted: false,
    createdAt: new Date().toISOString(), flagged: false
  };
  db.data.communityReplies.push(reply);

  // Notify post author
  if (post.userId !== req.user.id) {
    createNotification(post.userId, 'reply',
      `Someone replied to your post: "${post.title.substring(0,50)}"`,
      `/community.html?post=${post.id}`);
  }
  await db.write();
  res.status(201).json(reply);
});

app.post('/api/posts/:id/upvote', verifyToken, async (req, res) => {
  await db.read();
  const post = db.data.communityPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const idx = post.upvotes.indexOf(req.user.id);
  if (idx === -1) {
    post.upvotes.push(req.user.id);
    const user = db.data.users.find(u => u.id === post.userId);
    if (user) user.totalPoints = (user.totalPoints || 0) + 5;
    // Check helper badge
    const totalUpvotes = db.data.communityReplies
      .filter(r => r.userId === post.userId)
      .reduce((s, r) => s + r.upvotes.length, 0);
    if (totalUpvotes >= 10) await awardBadge(post.userId, 'helper');
  } else {
    post.upvotes.splice(idx, 1);
  }
  await db.write();
  res.json({ upvotes: post.upvotes.length, upvoted: idx === -1 });
});

app.post('/api/posts/:id/replies/:rid/upvote', verifyToken, async (req, res) => {
  await db.read();
  const reply = db.data.communityReplies.find(r => r.id === req.params.rid);
  if (!reply) return res.status(404).json({ message: 'Reply not found' });
  const idx = reply.upvotes.indexOf(req.user.id);
  if (idx === -1) reply.upvotes.push(req.user.id);
  else reply.upvotes.splice(idx, 1);
  await db.write();
  res.json({ upvotes: reply.upvotes.length });
});

app.post('/api/posts/:id/replies/:rid/accept', verifyToken, async (req, res) => {
  await db.read();
  const post = db.data.communityPosts.find(p => p.id === req.params.id);
  if (!post || post.userId !== req.user.id)
    return res.status(403).json({ message: 'Only the original poster can accept an answer' });
  const reply = db.data.communityReplies.find(r => r.id === req.params.rid);
  if (!reply) return res.status(404).json({ message: 'Reply not found' });
  // Unaccept previous
  db.data.communityReplies.filter(r => r.postId === req.params.id).forEach(r => r.isAccepted = false);
  reply.isAccepted    = true;
  post.status         = 'answered';
  post.acceptedReplyId = reply.id;
  const user = db.data.users.find(u => u.id === reply.userId);
  if (user) user.totalPoints = (user.totalPoints || 0) + 25;
  await db.write();
  res.json({ success: true });
});

app.post('/api/posts/:id/flag', verifyToken, async (req, res) => {
  await db.read();
  const post = db.data.communityPosts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  post.flagged = true;
  db.data.users.filter(u => ['superadmin','executive'].includes(u.role)).forEach(admin => {
    createNotification(admin.id, 'moderation', 'A community post has been flagged for review', '/admin.html');
  });
  await db.write();
  res.json({ success: true });
});

// ──────────────────────────────
// MESSAGES
// ──────────────────────────────
app.get('/api/messages', verifyToken, async (req, res) => {
  await db.read();
  const userId = req.user.id;
  const msgs = db.data.messages.filter(m => m.fromUserId === userId || m.toUserId === userId);
  // Group by conversation partner
  const convMap = {};
  msgs.sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt)).forEach(m => {
    const partner = m.fromUserId === userId ? m.toUserId : m.fromUserId;
    if (!convMap[partner]) {
      const partnerUser = db.data.users.find(u => u.id === partner);
      convMap[partner] = { partnerId: partner, partnerUser: safeUser(partnerUser || {}), lastMessage: m, unreadCount: 0 };
    }
    if (m.toUserId === userId && !m.readAt) convMap[partner].unreadCount++;
  });
  res.json(Object.values(convMap));
});

app.get('/api/messages/:userId', verifyToken, async (req, res) => {
  await db.read();
  const me = req.user.id, them = req.params.userId;
  const thread = db.data.messages.filter(
    m => (m.fromUserId === me && m.toUserId === them) ||
         (m.fromUserId === them && m.toUserId === me)
  ).sort((a,b) => new Date(a.sentAt) - new Date(b.sentAt));
  res.json(thread);
});

app.post('/api/messages/:userId', verifyToken, async (req, res) => {
  await db.read();
  const message = {
    id: uuid(), fromUserId: req.user.id, toUserId: req.params.userId,
    body: req.body.body, readAt: null, sentAt: new Date().toISOString()
  };
  db.data.messages.push(message);
  createNotification(req.params.userId, 'message', 'You have a new message', '/messages.html');
  await db.write();
  res.status(201).json(message);
});

app.patch('/api/messages/:id/read', verifyToken, async (req, res) => {
  await db.read();
  const msg = db.data.messages.find(m => m.id === req.params.id && m.toUserId === req.user.id);
  if (!msg) return res.status(404).json({ message: 'Message not found' });
  msg.readAt = new Date().toISOString();
  await db.write();
  res.json({ success: true });
});

// ──────────────────────────────
// EVENTS
// ──────────────────────────────
app.get('/api/events', async (req, res) => {
  await db.read();
  res.json(db.data.events.sort((a,b) => new Date(a.date) - new Date(b.date)));
});

app.post('/api/events', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const event = { id: uuid(), ...req.body, createdBy: req.user.id, createdAt: new Date().toISOString() };
  db.data.events.push(event);
  // Notify all users
  db.data.users.forEach(u => {
    createNotification(u.id, 'event', `New event: ${event.title}`, '/events.html');
  });
  await db.write();
  res.status(201).json(event);
});

app.patch('/api/events/:id', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  const event = db.data.events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  Object.assign(event, req.body);
  await db.write();
  res.json(event);
});

app.delete('/api/events/:id', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  db.data.events = db.data.events.filter(e => e.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

// ──────────────────────────────
// RESOURCES
// ──────────────────────────────
app.get('/api/resources', verifyToken, async (req, res) => {
  await db.read();
  let resources = db.data.resources;
  if (req.query.type) resources = resources.filter(r => r.type === req.query.type);
  res.json(resources);
});

app.post('/api/resources', verifyToken, isAdmin, (req, res, next) => {
  req.uploadSubdir = 'resources';
  next();
}, upload.single('file'), async (req, res) => {
  await db.read();
  const resource = {
    id: uuid(), ...req.body,
    file: req.file ? `/uploads/resources/${req.file.filename}` : null,
    uploadedBy: req.user.id,
    uploadedAt: new Date().toISOString(),
    downloads: 0
  };
  db.data.resources.push(resource);
  await db.write();
  res.status(201).json(resource);
});

app.post('/api/resources/:id/download', verifyToken, async (req, res) => {
  await db.read();
  const resource = db.data.resources.find(r => r.id === req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  resource.downloads = (resource.downloads || 0) + 1;
  await db.write();
  res.json({ file: resource.file, url: resource.url });
});

// ──────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────
app.get('/api/notifications', verifyToken, async (req, res) => {
  await db.read();
  const notifs = db.data.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  await db.read();
  const notif = db.data.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) return res.status(404).json({ message: 'Notification not found' });
  notif.read = true;
  await db.write();
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', verifyToken, async (req, res) => {
  await db.read();
  db.data.notifications.filter(n => n.userId === req.user.id).forEach(n => n.read = true);
  await db.write();
  res.json({ success: true });
});

// ──────────────────────────────
// ADMIN STATS
// ──────────────────────────────
app.get('/api/admin/stats', verifyToken, isAdmin, async (req, res) => {
  await db.read();
  res.json({
    totalUsers:     db.data.users.filter(u => u.role === 'student').length,
    clubMembers:    db.data.users.filter(u => u.role === 'member').length,
    pendingApps:    db.data.membershipApplications.filter(a => a.status === 'pending').length,
    pendingProjects:db.data.projects.filter(p => p.status === 'pending').length,
    publishedLessons:db.data.lessons.filter(l => l.published).length,
    communityPosts: db.data.communityPosts.length,
    totalResources: db.data.resources.length,
    flaggedContent: db.data.communityPosts.filter(p => p.flagged).length
                  + (db.data.communityReplies.filter(r => r.flagged).length)
  });
});

// Gallery
app.get('/api/gallery', async (req, res) => {
  await db.read();
  res.json(db.data.gallery.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
});

app.post('/api/gallery', verifyToken, isAdmin, (req, res, next) => {
  req.uploadSubdir = 'gallery';
  next();
}, upload.single('image'), async (req, res) => {
  await db.read();
  const item = {
    id: uuid(), title: req.body.title || '',
    imageUrl: req.file ? `/uploads/gallery/${req.file.filename}` : null,
    uploadedBy: req.user.id, uploadedAt: new Date().toISOString()
  };
  db.data.gallery.push(item);
  await db.write();
  res.status(201).json(item);
});

// ──────────────────────────────
// SPA fallback — serve index for unknown routes
// ──────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
  res.sendFile(path.join(__dirname, 'public', 'trc-home.html'));
});

// ──────────────────────────────
// START
// ──────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ TRC Platform running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   DB file     : db.json`);
    console.log(`   Uploads     : ./uploads/`);
    console.log(`\n📋 Pages:`);
    console.log(`   Home        → http://localhost:${PORT}/trc-home.html`);
    console.log(`   Dashboard   → http://localhost:${PORT}/dashboard.html`);
    console.log(`   Admin       → http://localhost:${PORT}/admin.html`);
    console.log(`\n🔑 Default admin: admin@tarsco.edu / admin123`);
    console.log(`   ⚠  Change the password immediately after first login!\n`);
  });
});
