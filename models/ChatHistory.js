import { query } from "../util/database.js";

// I am going to have to do an INSERT than Update

export const createChatHistoryTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        messages JSONB DEFAULT '[{"role": "system", "content": "helpful resume builder"}]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW()
    )`
    );
  } catch (err) {
    console.error("Error creating chat_history table", err);
    throw err;
  }
};
