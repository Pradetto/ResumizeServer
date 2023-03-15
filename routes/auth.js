import express from "express";
import { login, logout, register, testLogout } from "../controllers/auth.js";
import isAuthenticated from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/test-logout", testLogout);
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

router.post("/fetch-user", async (req, res) => {
  if (req.sessionID && req.session.user) {
    res.status(200);
    return res.json({ user: req.session.user });
  }
  return res.sendStatus(403);
});

export default router;
