'use strict';

const { neon } = require('@neondatabase/serverless');

const DEFAULT_STATE = {
  users: [], membershipApplications: [], modules: [], lessons: [],
  quizzes: [], quizAttempts: [], lessonProgress: [], projects: [],
  projectComments: [], communityPosts: [], communityReplies: [],
  messages: [], events: [], resources: [], gallery: [],
  notifications: [], internalUpdates: [], badges: []
};

let client;
let schemaReady;

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is missing. Add your Neon connection string as a Vercel environment variable.');
  }
  if (!client) client = neon(connectionString);
  return client;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getClient();
      await sql`
        CREATE TABLE IF NOT EXISTS trc_app_state (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          data JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO trc_app_state (id, data)
        VALUES (1, ${JSON.stringify(DEFAULT_STATE)}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `;
    })().catch(error => {
      schemaReady = undefined;
      throw error;
    });
  }
  await schemaReady;
}

const db = {
  data: structuredClone(DEFAULT_STATE),
  async read() {
    await ensureSchema();
    const sql = getClient();
    const rows = await sql`SELECT data FROM trc_app_state WHERE id = 1`;
    this.data = rows[0]?.data || structuredClone(DEFAULT_STATE);
    return this.data;
  },
  async write() {
    await ensureSchema();
    const sql = getClient();
    await sql`
      INSERT INTO trc_app_state (id, data, updated_at)
      VALUES (1, ${JSON.stringify(this.data)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW()
    `;
    return this.data;
  }
};

module.exports = db;
