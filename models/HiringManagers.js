import { query } from "../util/database.js";

class HiringManagers {
  constructor() {}

  static createHiringManagersTable = async () => {
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'hiring_managers'
        )
      `);

      if (!tableExists.rows[0].exists) {
        await query(`
          CREATE TABLE hiring_managers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            hiring_manager TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);
      }

      const triggerExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_hiring_managers'
        )
      `);

      if (!triggerExists.rows[0].exists) {
        await query(`
          CREATE OR REPLACE FUNCTION update_hiring_managers()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER update_hiring_managers
          BEFORE UPDATE OF user_id, company_id, job_id, hiring_manager, address, phone, email
          ON hiring_managers
          FOR EACH ROW
          EXECUTE FUNCTION update_hiring_managers();
        `);
      }
    } catch (err) {
      console.error("Error creating hiring_managers table", err);
      throw err;
    }
  };
}

export default HiringManagers;
