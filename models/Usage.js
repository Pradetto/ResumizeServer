import { query } from "../util/database.js";

export const createUsageTable = async () => {
  try {
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'usage'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await query(`
        CREATE TABLE usage (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          prompt_tokens INTEGER NOT NULL DEFAULT 0,
          completion_tokens INTEGER NOT NULL DEFAULT 0,
          total_tokens_consumed INTEGER NOT NULL GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
          paid_token_remaining INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    }

    const triggerExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_usage'
      )
    `);

    if (!triggerExists.rows[0].exists) {
      await query(`
        CREATE OR REPLACE FUNCTION update_usage()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_usage
        BEFORE UPDATE OF prompt_tokens, completion_tokens, total_tokens_consumed, paid_token_remaining
        ON usage
        FOR EACH ROW
        EXECUTE FUNCTION update_usage();
      `);
    }
  } catch (err) {
    console.error("Error creating usage table", err);
    throw err;
  }
};
