import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    // The user is authenticated
    next();
  } else {
    // The user is not authenticated
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const verifyToken = async (req, res, next) => {
  const token = req.query.token || req.body.token;

  if (!token) {
    return res
      .status(403)
      .json({ message: "A token is required for authentication" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);

    // Find the user by the decoded id
    const user = await User.findByIdOrEmail(decoded.id, null);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  next();
};
