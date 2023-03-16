import { query } from "../util/database.js";

export const createResumeTable = async () => {
  try {
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'resumes'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await query(`
        CREATE TABLE resumes (
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
        );
      `);
    }

    const triggerExists = await query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_resumes'
      )
    `);

    if (!triggerExists.rows[0].exists) {
      await query(`
        CREATE OR REPLACE FUNCTION update_resumes()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at := NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_resumes
        BEFORE UPDATE OF filename, type, text, is_default
        ON resumes
        FOR EACH ROW
        EXECUTE FUNCTION update_resumes();
      `);
    }
  } catch (err) {
    console.error("Error creating resumes table", err);
    throw err;
  }
};
