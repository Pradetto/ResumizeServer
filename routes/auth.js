import express from "express";
import {
  authStatusController,
  deleteProfileController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resetPasswordController,
  updatePasswordController,
} from "../controllers/auth.js";
import { isAuthenticated, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);
router.get("/authstatus", isAuthenticated, authStatusController);
router.post("/updatepassword", isAuthenticated, updatePasswordController);
router.post("/forgotpassword", forgotPasswordController);
router.post("/resetpassword", verifyToken, resetPasswordController);
router.post("/deleteprofile", isAuthenticated, deleteProfileController);
// router.get("/protected", isAuthenticated, (req, res) => {
//   if (!req.session.views) {
//     req.session.views = 1;
//   } else {
//     req.session.views += 1;
//   }
//   res.status(200).json({
//     message: "You are authenticated!",
//     protected_views: req.session.views,
//   });
// });

export default router;
