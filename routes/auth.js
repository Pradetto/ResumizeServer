import express from "express";
import { authStatus, login, logout, register } from "../controllers/auth.js";
import isAuthenticated from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/auth-status", isAuthenticated, authStatus);
router.get("/protected", isAuthenticated, (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views += 1;
  }
  res.status(200).json({
    message: "You are authenticated!",
    protected_views: req.session.views,
  });
});

export default router;
