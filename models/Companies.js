import { query } from "../util/database.js";

class Companies {
  constructor() {}

  static createCompaniesTable = async () => {
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'companies'
        )
      `);

      if (!tableExists.rows[0].exists) {
        await query(`
          CREATE TABLE companies (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(company_name, user_id)
          );
        `);
      }

      const triggerExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_companies'
        )
      `);

      if (!triggerExists.rows[0].exists) {
        await query(`
          CREATE OR REPLACE FUNCTION update_companies()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER update_companies
          BEFORE UPDATE OF user_id, company_name
          ON companies
          FOR EACH ROW
          EXECUTE FUNCTION update_companies();
        `);
      }
    } catch (err) {
      console.error("Error creating companies table", err);
      throw err;
    }
  };

  static async findCompanyById(id) {
    try {
      await query(
        `
        SELECT * FROM companies
        WHERE id = $1
        `,
        [id]
      );
    } catch (err) {
      console.error("Could not find Company ID", err.message);
      throw new Error("Could not find Company by ID");
    }
  }
  static async companiesList(user_id) {
    try {
      if (!user_id) {
        throw new Error("There is no user_id");
      }
      const res = await query(
        `
      SELECT id, user_id,company_name FROM companies
      WHERE user_id = $1
      ORDER BY company_name
      `,
        [user_id]
      );
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error("Could not retrieve companies list");
    }
  }

  static async insertCompany(user_id, company_name) {
    try {
      const res = await query(
        `
        INSERT INTO companies (user_id,company_name)
        VALUES ($1,$2)
        RETURNING *
        `,
        [user_id, company_name]
      );
      return res.rows[0];
    } catch (error) {
      console.error(err.message);
      throw new Error("Error inserting company");
    }
  }
  static async update(id, company_name) {}
}

export default Companies;
