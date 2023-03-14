import expressSession from "express-session";
import SessionStore from "../models/SessionStore.js";

const sessionMiddleware = (app) => {
  const sessionStore = new SessionStore();

  const sessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    logErrors: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    proxy: true,
  };

  app.use(expressSession(sessionOptions));
  console.log("session middlewware enabled");
};

export default sessionMiddleware;
