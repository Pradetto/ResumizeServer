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
}
export default JobCoverLetters;
