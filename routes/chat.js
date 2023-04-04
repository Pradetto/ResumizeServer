/* CHAT WILL HANDLE TOKENS & CHATGPT RESPONSES */
import { getPrompt } from "../controllers/chat.js";

import express from "express";

const router = express.Router();

router.get("/prompt", getPrompt);

export default router;
