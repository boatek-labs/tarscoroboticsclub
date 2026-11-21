/**
 * TRC Platform — Seed Script
 * Run with: node setup.js
 * Populates db.json with demo modules, lessons, a quiz, an event, and a resource
 * so the platform isn't empty on first run.
 */

const { Low }      = require('lowdb');
const { JSONFile }  = require('lowdb/node');
const { v4: uuid }  = require('uuid');

const adapter = new JSONFile('db.json');
const db = new Low(adapter, {});

async function seed() {
  await db.read();
  const defaults = {
    users: [], membershipApplications: [], modules: [], lessons: [],
    quizzes: [], quizAttempts: [], lessonProgress: [], projects: [],
    projectComments: [], communityPosts: [], communityReplies: [],
    messages: [], events: [], resources: [], gallery: [],
    notifications: [], internalUpdates: [], badges: []
  };
  db.data = db.data && Object.keys(db.data).length ? db.data : defaults;
  for (const key of Object.keys(defaults)) {
    if (!db.data[key]) db.data[key] = defaults[key];
  }

  if (db.data.modules.length) {
    console.log('⚠ Modules already exist — skipping seed to avoid duplicates.');
    return;
  }

  // ── MODULES ──
  const modules = [
    { id: uuid(), title: 'Introduction to Robotics', level: 'beginner', order: 1, published: true, coverEmoji: '🤖', estimatedHours: 3,
      description: 'What is a robot? History, types, applications, and core components.' },
    { id: uuid(), title: 'Basic Electronics', level: 'beginner', order: 2, published: true, coverEmoji: '⚡', estimatedHours: 4,
      description: 'Voltage, current, resistance, breadboards, and your first circuit.' },
    { id: uuid(), title: 'Arduino Basics', level: 'beginner', order: 3, published: true, coverEmoji: '🔌', estimatedHours: 5,
      description: 'Setup, pins, serial monitor, digital I/O, and your first sketches.' },
    { id: uuid(), title: 'Sensors & Actuators', level: 'intermediate', order: 4, published: true, coverEmoji: '📡', estimatedHours: 6,
      description: 'Ultrasonic, IR, servos, DC motors, and stepper motors.' },
    { id: uuid(), title: 'Programming for Robotics', level: 'intermediate', order: 5, published: true, coverEmoji: '💻', estimatedHours: 5,
      description: 'Logic, loops, functions, and state machines for robotics control.' },
    { id: uuid(), title: 'Safety in Robotics & Electronics', level: 'intermediate', order: 6, published: true, coverEmoji: '⚠️', estimatedHours: 3,
      description: 'Short circuits, voltage limits, soldering safety, and component ratings.' },
    { id: uuid(), title: 'AI in Robotics', level: 'advanced', order: 7, published: false, coverEmoji: '🧠', estimatedHours: 8,
      description: 'Computer vision, object detection, edge AI on microcontrollers.' },
    { id: uuid(), title: 'Competition Robotics', level: 'advanced', order: 8, published: false, coverEmoji: '🏆', estimatedHours: 10,
      description: 'Strategy, autonomous routines, and what it takes to compete.' },
  ];
  db.data.modules.push(...modules);

  // ── LESSONS (Module 2 — Basic Electronics, full example) ──
  const electronicsModule = modules[1];
  const lessons = [
    { id: uuid(), moduleId: electronicsModule.id, title: 'What is Electricity?', order: 1, published: true, durationMin: 18,
      content: { objectives: ['Understand atoms, electrons, and charge', 'Define voltage, current, resistance'],
                 materials: [], sections: [{ type:'text', heading:'Electricity Basics', body:'Electricity is the flow of electrons through a conductor...' }] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Voltage, Current & Resistance', order: 2, published: true, durationMin: 22,
      content: { objectives: ["Understand Ohm's Law", 'Calculate voltage/current/resistance'],
                 materials: [], sections: [{ type:'text', heading:"Ohm's Law", body:'V = I × R is the foundation of circuit analysis...' }] } },
    { id: uuid(), moduleId: electronicsModule.id, title: "Ohm's Law", order: 3, published: true, durationMin: 20, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Series vs Parallel', order: 4, published: true, durationMin: 25, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Resistors & LEDs', order: 5, published: true, durationMin: 22, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Capacitors', order: 6, published: true, durationMin: 20, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Breadboards & Building Your First Circuit', order: 7, published: true, durationMin: 30,
      content: {
        objectives: ['Understand breadboard layout', 'Read a schematic', 'Calculate resistor values', 'Wire a working LED circuit'],
        materials: ['Breadboard', 'Arduino Uno or 9V battery', '2x LED', '2x 220Ω resistor', 'Jumper wires'],
        sections: [
          { type:'text', heading:'How a Breadboard Works', body:'A breadboard lets you prototype circuits without soldering...' },
          { type:'code', heading:'Test with Arduino', lang:'arduino',
            code:'void setup() {\n  pinMode(9, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(9, HIGH);\n  delay(500);\n  digitalWrite(9, LOW);\n  delay(500);\n}' }
        ]
      } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Transistors', order: 8, published: true, durationMin: 24, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Diodes', order: 9, published: true, durationMin: 18, content: { objectives: [], materials: [], sections: [] } },
    { id: uuid(), moduleId: electronicsModule.id, title: 'Module 2 Final Quiz', order: 10, published: true, durationMin: 10, content: { objectives: [], materials: [], sections: [] } },
  ];
  db.data.lessons.push(...lessons);

  // ── QUIZ for lesson 7 ──
  const lesson7 = lessons[6];
  db.data.quizzes.push({
    id: uuid(), lessonId: lesson7.id,
    questions: [
      { id: uuid(), text: "What does Ohm's Law state?", options: ['V = I × R','V = I + R','V = I / R','V = I² × R'], correct: 0,
        explanation: "Ohm's Law is V = I × R — the foundation of circuit analysis." },
      { id: uuid(), text: 'On a breadboard, which holes are internally connected?', options: ['All holes in a half-row (a-e or f-j)','All holes across the gap','Only the power rails','Nothing is connected'], correct: 0,
        explanation: 'Each half-row of 5 holes is connected by a metal strip underneath.' },
    ]
  });

  // ── EVENT ──
  db.data.events.push({
    id: uuid(), title: 'Regional Robotics Championship',
    description: 'TRC sends 3 teams. Open spectating for all students.',
    type: 'competition', date: '2025-07-14', time: '09:00',
    location: 'TARSCO Assembly Hall', memberOnly: false,
    createdBy: 'system', createdAt: new Date().toISOString()
  });
  db.data.events.push({
    id: uuid(), title: 'Free Arduino Workshop',
    description: 'Open to all TARSCO students. Components provided.',
    type: 'workshop', date: '2025-07-21', time: '14:00',
    location: 'Computer Lab B', memberOnly: false,
    createdBy: 'system', createdAt: new Date().toISOString()
  });

  // ── RESOURCE ──
  db.data.resources.push({
    id: uuid(), title: 'Arduino Quick Reference Sheet',
    description: 'Essential Arduino functions, pin mappings, and library calls.',
    type: 'pdf', file: null, url: null,
    uploadedBy: 'system', uploadedAt: new Date().toISOString(), downloads: 0
  });

  await db.write();
  console.log('✅ Seed complete:');
  console.log(`   ${modules.length} modules`);
  console.log(`   ${lessons.length} lessons (Basic Electronics)`);
  console.log(`   1 quiz`);
  console.log(`   2 events`);
  console.log(`   1 resource`);
  console.log('\nRun `npm start` to launch the server.');
}

seed();
