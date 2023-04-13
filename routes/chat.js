/* CHAT WILL HANDLE TOKENS & CHATGPT RESPONSES */
import { promptHandlerController } from "../controllers/chat.js";

import express from "express";

const router = express.Router();

router.post("/prompt", promptHandlerController);

export default router;
