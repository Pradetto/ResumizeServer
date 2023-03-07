import { query } from "../util/database.js";

export const createCoverLetterTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS cover_letters (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, filename)
        CONSTRAINT unique_default_cover_letter UNIQUE (user_id, default)
    )`
    );
  } catch (err) {
    console.error("Error creating cover_letters table", err);
    throw err;
  }
};
