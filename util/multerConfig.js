// upload.js
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "./s3Config";

const upload = multer({
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
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: (req, file, cb) => {
      cb(
        null,
        req.session.user.id + "/" + Date.now() + "-" + file.originalname
      );
    },
  }),
});

export default upload;
