import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.session.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    console.log(user);
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).send({ message: "Unauthorized" });
  }
};
