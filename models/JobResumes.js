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
        UNIQUE(job_id, user_id, resume_id)
        );
      `
    );
  } catch (err) {
    console.error("Error creating job_resumes table", err);
    throw err;
  }
};

// CREATE TABLE chat_history (
//   id SERIAL PRIMARY KEY,
//   user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//   document_type TEXT NOT NULL, -- Add this column to store the type of document (resume or cover letter)
//   job_description TEXT NOT NULL, -- Add this column to store the job_description
//   messages JSONB DEFAULT '[{"role": "system", "content": "helpful resume builder"}]',
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
