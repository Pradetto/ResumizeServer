import { query } from "../util/database.js";

export const createJobsTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        summary TEXT NOT NULL,
        link TEXT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW(),
        UNIQUE(link, user_id)
    )`
    );
  } catch (err) {
    console.error("Error creating jobs table", err);
    throw err;
  }
};
