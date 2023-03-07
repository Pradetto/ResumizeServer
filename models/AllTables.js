// import { query } from "../util/database.js";

// export const createUserTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS users (
//       id SERIAL PRIMARY KEY,
//       firstname TEXT NOT NULL,
//       lastname TEXT NOT NULL,
//       email TEXT UNIQUE NOT NULL,
//       password TEXT NOT NULL,
//       role TEXT DEFAULT 'user',
//       tokens JSONB[] DEFAULT '{}',
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
//     )`
//   );
// };

// export const createResumeTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS resumes (
//       id SERIAL PRIMARY KEY,
//       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       filename TEXT NOT NULL,
//       type TEXT NOT NULL,
//       text TEXT NOT NULL,
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       UNIQUE(user_id, filename)
//     )`
//   );
// };

// export const createCoverLetterTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS cover_letters (
//       id SERIAL PRIMARY KEY,
//       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       filename TEXT NOT NULL,
//       type TEXT NOT NULL,
//       text TEXT NOT NULL,
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       UNIQUE(user_id, filename)
//     )`
//   );
// };

// export const createJobsTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS jobs (
//       id SERIAL PRIMARY KEY,
//       company TEXT NOT NULL,
//       position TEXT NOT NULL,
//       summary TEXT NOT NULL,
//       link TEXT NOT NULL,
//       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       UNIQUE(link, user_id)
//     )`
//   );
// };

// export const createJobResumesTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS job_resumes (
//       id SERIAL PRIMARY KEY,
//       job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
//       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       UNIQUE(job_id, user_id, resume_id)
//     )`
//   );
// };

// export const createJobCoverLettersTable = async () => {
//   await query(
//     `CREATE TABLE IF NOT EXISTS job_cover_letters (
//       id SERIAL PRIMARY KEY,
//       job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
//       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//       cover_letter_id INTEGER NOT NULL REFERENCES cover_letters(id) ON DELETE CASCADE,
//       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//       UNIQUE(job_id, user_id, cover_letter_id)
//     )`
//   );
// };
