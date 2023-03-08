import pkg from "pg";
const { Pool } = pkg;

/* MODELS */
import { createCoverLetterTable } from "../models/CoverLetter.js";
import { createJobCoverLettersTable } from "../models/JobCoverLetters.js";
import { createJobResumesTable } from "../models/JobResumes.js";
import { createJobsTable } from "../models/Jobs.js";
import { createResumeTable } from "../models/Resume.js";
// import { createUserTable } from "../models/User.js";
import { createUsageTable } from "../models/Usage.js";
import { createChatHistoryTable } from "../models/ChatHistory.js";

import User from "../models/User.js";

/* TABLES */
const { createUserTable } = User;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connect = async () => {
  await pool.connect();
};

export const query = async (text, params) => {
  return pool.query(text, params);
};

export const createModels = async () => {
  try {
    await createUserTable();
    await createCoverLetterTable();
    await createResumeTable();
    await createJobsTable();
    await createJobCoverLettersTable();
    await createJobResumesTable();
    await createUsageTable();
    await createChatHistoryTable();
  } catch (err) {
    console.error(err.message);
  }
};
