import express from "express";
import {
  getProfileInfoController,
  getResumesListController,
} from "../controllers/general.js";

const router = express.Router();

router.get("/profileinfo", getProfileInfoController);

router.get("/resumes", getResumesListController);

export default router;
