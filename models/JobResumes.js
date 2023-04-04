import { query } from "../util/database.js";

class JobsResume {
  constructor() {}
  static createJobResumesTable = async () => {
    try {
      await query(
        `CREATE TABLE IF NOT EXISTS job_resumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(job_id, user_id, resume_id)
        );
      `
      );
    } catch (err) {
      console.error("Error creating job_resumes table", err);
      throw err;
    }
  };

  static createJobsResume = async (user_id, job_id, resume_id) => {
    try {
      const res = await query(
        `
      INSERT into job_resumes (user_id,job_id,resume_id)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
        [user_id, job_id, resume_id]
      );

      return res.rows[0];
    } catch (err) {
      if (err.code === "23505") {
        // Unique violation error code
        console.error(
          "Error inserting Job Resume: The connection already exists for this user please edit or update entry",
          err.message
        );
        throw new Error(
          "The connection already exists for this user. Please update existing job."
        );
      } else {
        console.error("Error inserting Job_Resume", err.message);
        throw new Error("Error inserting Job_Resume");
      }
    }
  };
}

export default JobsResume;
