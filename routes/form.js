import express from "express";
import {
  createJobRoleController,
  formSubmissionController,
  getCompaniesListController,
  getJobsListController,
  getProfileInfoController,
  getResumesListController,
  insertCompanyController,
} from "../controllers/form.js";

const router = express.Router();

router.post("/submit", formSubmissionController);

router.get("/profileinfo", getProfileInfoController);
router.get("/resumes", getResumesListController);

/* COMPANIES */
router.get("/companies", getCompaniesListController);
router.post("/postcompany", insertCompanyController);

/* JOBS */
router.get("/jobs/:company_id", getJobsListController);
router.post("/createrole", createJobRoleController);

export default router;
