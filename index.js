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
import authRouter from "./routes/auth.js";
import formRouter from "./routes/form.js";
import fileStorageRouter from "./routes/fileStorage.js";
import chatRouter from "./routes/chat.js";
import generalRouter from "./routes/general.js";
import { isAuthenticated } from "./middleware/authMiddleware.js";

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

app.use((req, res) => {
  res.send("Server is currently up and running");
});

/* CUSTOM MIDDLEWARE */
sessionMiddleware(app);

/* ROUTES */
app.use("/auth", authRouter);
app.use("/form", isAuthenticated, formRouter);
app.use("/general", isAuthenticated, fileStorageRouter);
app.use("/general", isAuthenticated, generalRouter);
app.use("/chat", chatRouter);

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
