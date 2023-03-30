import express from "express";
import {
  createJobController,
  createRoleController,
  deleteDraftsController,
  formSubmissionController,
  getCompaniesListController,
  getExistingLinkController,
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
router.get("/roles/:company_id", getUniqueRolesController);
router.get("/deletedrafts", deleteDraftsController);
router.post("/createjob", createJobController);

/* ROLES */
router.get("/link/:link_id", getExistingLinkController);
router.post("/createrole", createRoleController);

export default router;
