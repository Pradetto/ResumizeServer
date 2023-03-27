import { query } from "../util/database.js";

class Jobs {
  constructor() {}

  static createJobsTable = async () => {
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'jobs'
        )
      `);

      if (!tableExists.rows[0].exists) {
        await query(`
          CREATE TABLE jobs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            link TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(link, user_id)
          );
        `);
      }

      const triggerExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_jobs'
        )
      `);

      if (!triggerExists.rows[0].exists) {
        await query(`
          CREATE OR REPLACE FUNCTION update_jobs()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER update_jobs
          BEFORE UPDATE OF company_id, role, description, link
          ON jobs
          FOR EACH ROW
          EXECUTE FUNCTION update_jobs();
        `);
      }
    } catch (err) {
      console.error("Error creating jobs table", err);
      throw err;
    }
  };
}

export default Jobs;
