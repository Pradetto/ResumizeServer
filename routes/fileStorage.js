import express from "express";
import {
  uploadController,
  downloadController,
} from "../controllers/fileStorage.js";
import upload from "../util/multerConfig.js";

const router = express.Router();

router.post("/upload", upload, uploadController);
router.get("/download/:fileKey", downloadController);

export default router;
