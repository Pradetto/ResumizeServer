/* CHAT WILL HANDLE TOKENS & CHATGPT RESPONSES */
import { getPromptHandlerController } from "../controllers/chat.js";

import express from "express";

const router = express.Router();

router.get("/prompt", getPromptHandlerController);

export default router;
