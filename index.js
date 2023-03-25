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
import fileStorageRouter from "./routes/fileStorage.js";
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

// aws.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new aws.S3();
// const upload = multer({
//   fileFilter: (req, file, cb) => {
//     const allowedMimes = [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//     ];
//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type. Only PDF and Word files are allowed."));
//     }
//   },
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET_NAME,
//     key: (req, file, cb) => {
//       cb(
//         null,
//         req.session.user.id + "/" + Date.now() + "-" + file.originalname
//       );
//     },
//   }),
// });

/* CUSTOM MIDDLEWARE */
sessionMiddleware(app);

/* ROUTES */
app.use("/general", isAuthenticated, generalRouter);
app.use("/general", isAuthenticated, fileStorageRouter);
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
