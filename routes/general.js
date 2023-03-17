import express from "express";
import { getContactInfoController, getPrompt } from "../controllers/general.js";

const router = express.Router();

router.post("/chat", getPrompt);

router.get("/contactinfo", getContactInfoController);

export default router;
