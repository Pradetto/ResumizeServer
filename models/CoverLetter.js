import { query } from "../util/database.js";

export const createCoverLetterTable = async () => {
  try {
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'cover_letters'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await query(`
        CREATE TABLE cover_letters (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          type TEXT NOT NULL,
          text TEXT NOT NULL,
          is_default BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, filename),
          CONSTRAINT unique_default_cover_letter UNIQUE (user_id, is_default)
        );
      `);
    }

    const triggerExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_cover_letters'
      )
    `);

    if (!triggerExists.rows[0].exists) {
      await query(`
        CREATE OR REPLACE FUNCTION update_cover_letters()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_cover_letters
        BEFORE UPDATE OF filename, type, text, is_default
        ON cover_letters
        FOR EACH ROW
        EXECUTE FUNCTION update_cover_letters();
      `);
    }
  } catch (err) {
    console.error("Error creating cover_letters table", err);
    throw err;
  }
};
