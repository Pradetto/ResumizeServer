import express from "express";
import {
  authStatusController,
  loginController,
  logoutController,
  registerController,
  resetPasswordController,
  updatePasswordController,
} from "../controllers/auth.js";
import isAuthenticated from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/auth-status", isAuthenticated, authStatusController);
router.post("/update-password", isAuthenticated, updatePasswordController);
router.post("/reset-password", resetPasswordController);
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
