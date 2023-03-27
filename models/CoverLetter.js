import { query } from "../util/database.js";

class CoverLetter {
  constructor(id, user_id, file_key, file_type, file_name, is_default, text) {
    this.id = id;
    this.user_id = user_id;
    this.file_key = file_key;
    this.file_type = file_type;
    this.file_name = file_name;
    this.is_default = is_default;
    this.text = text;
  }

  publicData() {
    return {
      user_id: this.user_id,
      file_name: this.file_name,
      is_default: this.is_default,
    };
  }

  static async createCoverLetterTable() {
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
          file_key TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          is_default BOOLEAN NOT NULL DEFAULT false,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, file_key),
          UNIQUE(user_id, file_name)
          );
          `);
        console.log("cover_letters table created");
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
              BEFORE UPDATE OF file_key, file_type, file_name, is_default, text
              ON cover_letters
              FOR EACH ROW
              EXECUTE FUNCTION update_cover_letters();
            `);
      }
    } catch (err) {
      console.error("Error creating cover_letters table", err);
      throw err;
    }
  }

  static async insertCoverLetter(
    user_id,
    fileKey,
    fileType,
    fileName,
    text,
    is_default = false
  ) {
    try {
      if (is_default) {
        this.resetIsDefault(user_id);
        console.log("resetting is True");
      }
      await query(
        `INSERT INTO cover_letters (user_id, file_key, file_type, file_name, text, is_default) VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id, fileKey, fileType, fileName, text, is_default]
      );
    } catch (err) {
      console.error("Error inserting file", err);
      if (err.code === "23505") {
        throw new Error("File name already taken.");
      } else {
        throw new Error("Error inserting file.");
      }
    }
  }

  static async findByUserId(user_id) {
    try {
      const result = await query(
        `SELECT * FROM cover_letters WHERE user_id = $1`,
        [user_id]
      );
      return result.rows;
    } catch (err) {
      console.error("error finding user by id", err, user_id);
    }
  }

  static async coverLetterList(user_id) {
    try {
      const result = await query(
        `SELECT id, user_id, file_key, file_name, is_default, updated_at FROM cover_letters WHERE user_id = $1`,
        [user_id]
      );
      return result.rows;
    } catch (err) {
      console.error("error finding user by id", err, user_id);
    }
  }

  /* I COULD ALSO ADD A TRIGGER HERE TO HANDLE THIS BUT FOR NOW CALL BEFORE UPDATE AND INSERT */
  static async resetIsDefault(user_id) {
    try {
      await query(
        `UPDATE cover_letters SET is_default = false WHERE user_id = ($1) AND is_default = true`,
        [user_id]
      );
    } catch (err) {
      throw new Error({ message: err.message });
    }
  }
}

export default CoverLetter;
