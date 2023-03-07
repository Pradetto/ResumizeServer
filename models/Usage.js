import { query } from "../util/database.js";

export const createUsageTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS usage (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens_consumed INTEGER NOT NULL GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
        paid_token_remaining INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW()
    )`
    );
  } catch (err) {
    console.error("Error creating usage table", err);
    throw err;
  }
};
