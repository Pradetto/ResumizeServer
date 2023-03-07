import { query } from "../util/database.js";

export const createUserTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firstname TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      tokens JSONB[] DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    );
  } catch (err) {
    console.error("Error creating users table", err);
    throw err;
  }
};
