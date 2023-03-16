import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

/* MODELS */
import sessionMiddleware from "./middleware/sessionMiddleware.js";

/* DATABASE */
import { connect, createModels } from "./util/database.js";

/* Routes */
import generalRouter from "./routes/general.js";
import authRouter from "./routes/auth.js";

dotenv.config();
const PORT = process.env.PORT || 8001;
const app = express();

/* MIDDLEWARE */
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

/* CUSTOM MIDDLEWARE */
sessionMiddleware(app);

/* ROUTES */
app.use(generalRouter);
app.use("/auth", authRouter);

app.use((req, res, next) => {
  console.log("Request headers:", req.headers);
  next();
});

(async () => {
  try {
    /* DATABSE */
    await connect();
    await createModels();

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error(err.message);
  }
})();
