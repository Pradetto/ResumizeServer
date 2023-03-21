import { query } from "../util/database.js";

export const createChatHistoryTable = async () => {
  try {
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'chat_history'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await query(`
        CREATE TABLE chat_history (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          messages JSONB DEFAULT '[{"role": "system", "content": "helpful resume builder"}]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    }

    const triggerExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_chat_history'
      )
    `);

    if (!triggerExists.rows[0].exists) {
      await query(`
        CREATE OR REPLACE FUNCTION update_chat_history()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_chat_history
        BEFORE UPDATE OF messages
        ON chat_history
        FOR EACH ROW
        EXECUTE FUNCTION update_chat_history();
      `);
    }
  } catch (err) {
    console.error("Error creating chat_history table", err);
    throw err;
  }
};
