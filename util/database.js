import pkg from "pg";
const { Pool } = pkg;

/* MODELS */
import User from "../models/User.js";
import ContactInfo from "../models/ContactInfo.js";
import Usage from "../models/Usage.js";
import Resume from "../models/Resume.js";
import Jobs from "../models/Jobs.js";
import HiringManagers from "../models/HiringManagers.js";
import Companies from "../models/Companies.js";
import ChatHistory from "../models/ChatHistory.js";
import Session from "../models/SessionStore.js";
import JobsResume from "../models/JobResumes.js";
import CoverLetter from "../models/CoverLetter.js";
import JobCoverLetters from "../models/JobCoverLetters.js";
import Roles from "../models/Roles.js";

/* TABLES */

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
    /* USER -> CONTACT INFO | USAGE | CHATHISTORY | SESSION */
    await User.createUserTable();
    await ContactInfo.createContactInfoTable();
    await Usage.createUsageTable();
    await Session.createSessionTable();

    /* COMPANY -> ROLES -> JOB -> HIRING MANAGER */
    await Companies.createCompaniesTable();
    await Roles.createRolesTable();
    await Jobs.createJobsTable();
    await HiringManagers.createHiringManagersTable();

    /* RESMUES -> JOBSRESUMES */
    await Resume.createResumeTable();
    await JobsResume.createJobResumesTable();

    /* COVER LETTERS -> JOBS COVER LETTERS */
    await CoverLetter.createCoverLetterTable();
    await JobCoverLetters.createJobCoverLettersTable();

    await ChatHistory.createChatHistoryTable();
  } catch (err) {
    console.error(err.message);
  }
};
