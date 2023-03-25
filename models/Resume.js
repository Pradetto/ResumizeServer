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
          doc_url TEXT NOT NULL,
          pdf_url TEXT NOT NULL,
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
  }

  static async insertResume(user_id, docUrl, pdfUrl, text) {
    try {
      await query(
        `
        INSERT INTO resumes (user_id,doc_url,pdf_url,text)
        VALUES ($1,$2)
        `,
        [user_id, docUrl, pdfUrl, text]
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
