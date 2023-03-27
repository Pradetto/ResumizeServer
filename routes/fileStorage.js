import express from "express";
import {
  uploadController,
  downloadController,
} from "../controllers/fileStorage.js";
import { uploadResume } from "../util/multerConfig.js";

const router = express.Router();

router.post("/upload", uploadResume, uploadController);
router.get("/download/:fileKey", downloadController);

export default router;
