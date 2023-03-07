import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

/* DATABSE */
import { connect } from "./util/database.js";
// import createUserTable

/* Routes */
import generalRouter from "./routes/general.js";

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

(async () => {
  try {
    /* DATABSE */
    await connect();

    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error(err.message);
  }
})();
