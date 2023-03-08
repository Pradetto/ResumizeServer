import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

/* DATABASE */
import { connect, createModels } from "./util/database.js";

/* Routes */
import generalRouter from "./routes/general.js";
import authRouter from "./routes/auth.js";

dotenv.config();
const PORT = process.env.PORT || 8001;
const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));

/* ROUTES */
app.use(generalRouter);
app.use("/auth", authRouter);

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
