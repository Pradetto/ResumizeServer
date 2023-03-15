import expressSession from "express-session";
import pg from "pg";
import PgStore from "connect-pg-simple";

const sessionMiddleware = (app) => {
  const store = new (PgStore(expressSession))({
    pg,
    conString: process.env.DATABASE_URL,
    tableName: "session",
  });

  const sessionOptions = {
    store: store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    logErrors: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.use(expressSession(sessionOptions));
  console.log("session middleware enabled");
};

export default sessionMiddleware;
