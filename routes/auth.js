import express from "express";
import { login, logout, register } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/protected", authMiddleware, (req, res, next) => {
  res.send("you made it to the secret route yay!");
});

export default router;
