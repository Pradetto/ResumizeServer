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
            hiring_manager TEXT NOT NULL,
            address TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            email TEXT DEFAULT '',
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
          BEFORE UPDATE OF user_id, company_id, hiring_manager, address, phone, email
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

  static async hiringManagersByCompanyId(user_id, company_id) {
    try {
      const res = await query(
        `
        SELECT id, company_id,hiring_manager,address,phone,email FROM hiring_managers
        WHERE user_id = $1 AND company_id = $2
        ORDER BY hiring_manager
          `,
        [user_id, company_id]
      );
      return res.rows;
    } catch (err) {
      console.error(
        "Error retrieving Hiring Manager by Company id",
        err.message
      );
      throw new Error("Error retrieving Hiring Manager by id");
    }
  }

  static async createHiringManager(user_id, company_id, role_name) {
    try {
      const res = await query(
        `
        INSERT INTO hiring_managers (user_id, company_id, hiring_manager)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [user_id, company_id, role_name]
      );
      return res.rows[0];
    } catch (err) {
      if (err.code === "23505") {
        // Unique violation error code
        console.error(
          "Error inserting Hiring Manager: The role already exists for this user and company",
          err.message
        );
        throw new Error("The hiring manager already exists for this company");
      } else {
        console.error(err.message);
        throw new Error("Error inserting hiring manager");
      }
    }
  }
}

export default HiringManagers;
