import express from "express";
import { login, logout, register } from "../controllers/auth.js";
// import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
// router.get("/protected", authMiddleware, (req, res, next) => {
//   res.send("you made it to the secret route yay!");
// });
router.post("/fetch-user", async (req, res) => {
  if (req.sessionID && req.session.user) {
    res.status(200);
    return res.json({ user: req.session.user });
  }
  return res.sendStatus(403);
});

export default router;
