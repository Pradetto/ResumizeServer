import express from "express";
import {
  uploadController,
  downloadController,
  downloadDefaultController,
} from "../controllers/fileStorage.js";
import { uploadResume } from "../util/multerConfig.js";

const router = express.Router();

router.post("/upload", uploadResume, uploadController);
router.get("/download", downloadController);
router.get("/download/default", downloadDefaultController);

export default router;
