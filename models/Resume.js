import { query } from "../util/database.js";
import { deleteFile } from "../controllers/fileStorage.js";

class Resume {
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
          is_default BOOLEAN NOT NULL DEFAULT false,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, file_key),
          UNIQUE(user_id, file_name)
        );
      `);
        console.log("resumes table created");
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
        BEFORE UPDATE OF file_key, file_type, file_name, is_default, text
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

  static async insertResume(
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
      }
      await query(
        `
        INSERT INTO resumes (user_id, file_key, file_type, file_name, text,is_default)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [user_id, fileKey, fileType, fileName, text, is_default]
      );
    } catch (err) {
      console.error("Error inserting file", err);

      if (err.code === "23505") {
        const res = await deleteFile(fileKey);
        throw new Error(`File name already taken. ${res}`);
      } else {
        const res = await deleteFile(fileKey);
        throw new Error(`Error inserting file. ${res}`);
      }
    }
  }

  static async findByUserId(user_id) {
    try {
      const result = await query(
        `
        SELECT * FROM resumes
        WHERE user_id = $1
        `,
        [user_id]
      );

      return result.rows;
      // return new Resume(
      //   resume.id,
      //   resume.user_id,
      //   resume.file_key,
      //   resume.file_type,
      //   resume.file_name,
      //   resume.is_default,
      //   resume.text
      // ).publicData();
    } catch (err) {
      console.error("error finding user by id", err, user_id);
    }
  }
  static async findByUserIdAndFileKey(user_id, fileKey) {
    try {
      const result = await query(
        `
        SELECT * FROM resumes
        WHERE user_id = $1 AND file_key = $2
        `,
        [user_id, fileKey]
      );

      return result.rows[0];
    } catch (err) {
      console.error("error finding user by id", err, user_id);
    }
  }
  static async findById(id) {
    try {
      const result = await query(
        `
        SELECT * FROM resumes
        WHERE id = $1
        `,
        [id]
      );

      return result.rows[0];
    } catch (err) {
      console.error("error finding by id", err, id);
    }
  }

  static async resumeList(user_id) {
    try {
      const result = await query(
        `
        SELECT id,user_id,file_key,file_name,is_default,updated_at FROM resumes
        WHERE user_id = $1
        `,
        [user_id]
      );

      return result.rows;
      // return new Resume(
      //   resume.id,
      //   resume.user_id,
      //   resume.file_key,
      //   resume.file_type,
      //   resume.file_name,
      //   resume.is_default,
      //   resume.text
      // ).publicData();
    } catch (err) {
      console.error("error finding user by id", err, user_id);
    }
  }

  static async updateIsDefault(id, user_id, is_default = false) {
    try {
      if (is_default) {
        this.resetIsDefault(user_id);
      }
      const res = await query(
        `
      UPDATE resumes
      SET is_default = $1
      WHERE id = $2
      RETURNING *
      `,
        [is_default, id]
      );
      return res.rows[0];
    } catch (error) {
      console.error("Error updating Is Default");
    }
  }
  /* I COULD ALSO ADD A TRIGGER HERE TO HANDLE THIS BUT FOR NOW CALL BEFORE UPDATE AND INSERT */
  static async resetIsDefault(user_id) {
    try {
      await query(
        `
        UPDATE resumes
        SET is_default = false
        WHERE user_id = ($1) AND is_default = true
        `,
        [user_id]
      );
    } catch (err) {
      throw new Error({ message: err.message });
    }
  }
}

export default Resume;
