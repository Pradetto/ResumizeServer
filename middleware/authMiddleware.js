// import jwt from "jsonwebtoken";

// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.cookies.token;
//     if (!token) {
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = decoded.id;
//     next();
//   } catch (err) {
//     console.error("Authentication error", err);
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// export default authMiddleware;

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    console.log(req.session.user);
    // The user is authenticated
    next();
  } else {
    // The user is not authenticated
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default isAuthenticated;
