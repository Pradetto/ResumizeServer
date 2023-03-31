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
  getUniqueRolesAndHiringManagersController,
  insertCompanyController,
  createHiringManagerController,
} from "../controllers/form.js";

const router = express.Router();

router.post("/submit", formSubmissionController);

router.get("/profileinfo", getProfileInfoController);
router.get("/resumes", getResumesListController);

/* COMPANIES */
router.get("/companies", getCompaniesListController);
router.post("/postcompany", insertCompanyController);

/* JOBS */
router.get("/deletedrafts", deleteDraftsController);
router.post("/createjob", createJobController);

/* ROLES */
router.get("/link/:link_id", getExistingLinkController);
router.post("/createrole", createRoleController);

/* COMPANY INFO */
router.get(
  "/companyinfo/:company_id",
  getUniqueRolesAndHiringManagersController
);

/* HIRING MANAGER */
router.post("/createhiringmanager", createHiringManagerController);

export default router;
