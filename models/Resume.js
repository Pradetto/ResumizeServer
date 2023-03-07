import { query } from "../util/database.js";

export const createResumeTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS resumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, filename),
        CONSTRAINT unique_default_resume UNIQUE (user_id, is_default)
    )`
    );
  } catch (err) {
    console.error("Error creating resumes table", err);
    throw err;
  }
};
