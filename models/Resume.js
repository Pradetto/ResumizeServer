import { query } from "../util/database.js";

class Resume {
  constructor() {}

  static async createResumeTable() {
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
          file_key TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, file_key),
          UNIQUE(user_id, file_name)
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
        BEFORE UPDATE OF file_key, file_type, file_name, text
        ON resumes
        FOR EACH ROW
        EXECUTE FUNCTION update_resumes();
      `);
      }
    } catch (err) {
      console.error("Error creating resumes table", err);
      throw err;
    }
  }

  static async insertResume(user_id, fileKey, fileType, fileName, text) {
    try {
      await query(
        `
        INSERT INTO resumes (user_id, file_key, file_type, file_name, text)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [user_id, fileKey, fileType, fileName, text]
      );
    } catch (err) {
      console.error("Error inserting file", err);

      if (err.code === "23505") {
        throw new Error("File name already taken");
      } else {
        throw new Error("Error inserting file");
      }
    }
  }
}

export default Resume;
