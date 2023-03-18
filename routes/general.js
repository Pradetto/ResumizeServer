import express from "express";
import { getProfileInfoController } from "../controllers/general.js";

const router = express.Router();

router.get("/profileinfo", getProfileInfoController);

export default router;
