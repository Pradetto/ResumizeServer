import multer from "multer";
import multerS3 from "multer-s3-v3"; // <-- Change the import here
import s3 from "./s3Config.js";
import dotenv from "dotenv";
dotenv.config();

export const uploadResume = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "private",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const fileKey =
        req.session.user.id +
        "/resumes/" +
        Date.now() +
        "-" +
        file.originalname;
      cb(null, fileKey);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and Word files are allowed."));
    }
  },
}).single("file");
