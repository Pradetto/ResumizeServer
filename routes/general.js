import express from "express";
import { filesController } from "../controllers/general.js";

const router = express.Router();

router.get("/files", filesController);

export default router;
