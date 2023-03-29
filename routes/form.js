import express from "express";
import {
  createJobRoleController,
  deleteDraftsController,
  formSubmissionController,
  getCompaniesListController,
  getProfileInfoController,
  getResumesListController,
  getUniqueRolesController,
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
router.get("/link/:link_id", getCompaniesListController);
router.get("/roles/:company_id", getUniqueRolesController);
router.get("/deletedrafts", deleteDraftsController);
router.post("/createrole", createJobRoleController);

export default router;
