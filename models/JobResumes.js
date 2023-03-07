import { query } from "../util/database.js";

export const createJobResumesTable = async () => {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS job_resumes (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() ON UPDATE NOW(),
        UNIQUE(job_id, user_id, resume_id)
    )`
    );
  } catch (err) {
    console.error("Error creating job_resumes table", err);
    throw err;
  }
};
