import { query } from "../util/database.js";

// So i designed this for my form to work it does not check fully complete validation but i will handle it on the frontend

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
            role TEXT DEFAULT '',
            link TEXT DEFAULT '',
            description TEXT DEFAULT '',
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

  static async jobList(user_id, company_id) {
    try {
      if (!user_id || !company_id) {
        throw new Error("There is no user_id and or company_id");
      }
      const res = await query(
        `
      SELECT id, user_id,company_id,role,link,description FROM jobs
      WHERE user_id = $1 AND company_id = $2
      ORDER BY role
      `,
        [user_id, company_id]
      );
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error("Could not retrieve roles list");
    }
  }

  static async createRole(user_id, company_id, role) {
    try {
      const res = await query(
        `
      INSERT INTO jobs (user_id,company_id,role)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
        [user_id, company_id, role]
      );
      return res.rows[0];
    } catch (err) {
      console.error("Error inserting Role", err.message);
      throw new Error("Error inserting Role");
    }
  }
}

export default Jobs;
