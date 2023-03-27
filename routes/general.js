import express from "express";
import {
  formSubmissionController,
  getProfileInfoController,
  getResumesListController,
} from "../controllers/general.js";

const router = express.Router();

router.post("/form", formSubmissionController);

router.get("/profileinfo", getProfileInfoController);
router.get("/resumes", getResumesListController);

export default router;
