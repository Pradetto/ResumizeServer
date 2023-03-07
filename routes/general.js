import express from "express";
import { getPrompt } from "../controllers/general.js";

const router = express.Router();

router.post("/chat", getPrompt);

export default router;
