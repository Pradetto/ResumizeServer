import { query } from "../util/database.js";

class JobCoverLetters {
  static createJobCoverLettersTable = async () => {
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS job_cover_letters (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cover_letter_id INTEGER NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(job_id, user_id, cover_letter_id)
        );
      `
      );
    } catch (err) {
      console.error("Error creating job_cover_letters table", err);
      throw err;
    }
  };

  static createJobsCoverLetter = async (user_id, job_id, cover_letter_id) => {
    try {
      const res = await query(
        `
      INSERT into job_cover_letters (user_id,job_id,cover_letter_id)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
        [user_id, job_id, cover_letter_id]
      );

      return res.rows[0];
    } catch (err) {
      if (err.code === "23505") {
        // Unique violation error code
        console.error(
          "Error inserting Job Cover letter: The connection already exists for this user please edit or update entry",
          err.message
        );
        throw new Error(
          "The connection already exists for this user. Please update existing job."
        );
      } else {
        console.error("Error inserting Job Cover letter", err.message);
        throw new Error("Error inserting Job Cover letter");
      }
    }
  };

  static async findByUserIdAndJobId(user_id, job_id) {
    try {
      const result = await query(
        `
      SELECT * FROM job_cover_letters
      WHERE user_id = $1 AND job_id = $2
      `,
        [user_id, job_id]
      );

      return result.rows[0];
    } catch (err) {
      console.error(
        "Error finding job cover letter by user_id and job_id",
        err
      );
      throw err;
    }
  }
}
export default JobCoverLetters;
