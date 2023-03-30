import { query } from "../util/database.js";

class Roles {
  constructor() {}

  static createRolesTable = async () => {
    try {
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = 'roles'
        )
      `);

      if (!tableExists.rows[0].exists) {
        await query(`
          CREATE TABLE roles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            role_name TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(role_name, user_id, company_id)
          );
        `);
      }

      const triggerExists = await query(`
        SELECT EXISTS (
          SELECT 1
          FROM pg_trigger
          WHERE tgname = 'update_roles'
        )
      `);

      if (!triggerExists.rows[0].exists) {
        await query(`
          CREATE OR REPLACE FUNCTION update_roles()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at := NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER update_roles
          BEFORE UPDATE OF user_id, company_id, role_name
          ON roles
          FOR EACH ROW
          EXECUTE FUNCTION update_roles();
        `);
      }
    } catch (err) {
      console.error("Error creating roles table", err);
      throw err;
    }
  };

  static async rolesList(user_id, company_id) {
    try {
      if (!user_id || !company_id) {
        throw new Error("There is no user_id and or company_id");
      }
      const res = await query(
        `
      SELECT id, user_id, company_id, role_name FROM roles
      WHERE user_id = $1 AND company_id = $2
      ORDER BY role_name
      `,
        [user_id, company_id]
      );
      return res.rows;
    } catch (err) {
      console.error(err.message);
      throw new Error("Could not retrieve roles list");
    }
  }

  static async uniqueRolesByUserIdCompanyId(user_id, company_id) {
    try {
      const res = await query(
        `
        SELECT id, role_name FROM roles
        WHERE user_id = $1 AND company_id = $2
        ORDER BY role_name
          `,
        [user_id, company_id]
      );
      return res.rows;
    } catch (err) {
      console.error("Error retrieving roles", err.message);
      throw new Error("Error retrieving roles");
    }
  }

  static async createRole(user_id, company_id, role_name) {
    try {
      const res = await query(
        `
        INSERT INTO roles (user_id, company_id, role_name)
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
          "Error inserting Role: The role already exists for this user and company",
          err.message
        );
        throw new Error("The role already exists for this company");
      } else {
        console.error(err.message);
        throw new Error("Error inserting role");
      }
    }
  }

  static async update(id, role_name) {
    try {
      const res = await query(
        `
        UPDATE roles
        SET role_name = $2
        WHERE id = $1
        RETURNING *
        `,
        [id, role_name]
      );
      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw new Error("Error updating role");
    }
  }

  static async deleteRole(id) {
    try {
      const res = await query(
        `
        DELETE FROM roles
        WHERE id = $1
        RETURNING *
        `,
        [id]
      );
      return res.rows[0];
    } catch (err) {
      console.error(err.message);
      throw new Error("Error deleting role");
    }
  }
}

export default Roles;
