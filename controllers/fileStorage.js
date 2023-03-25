import { processFile } from "../util/fileProcessing.js";
import Resume from "../models/Resume.js";
import { downloadFileFromS3 } from "../util/fileProcessing.js";

export const uploadController = async (req, res) => {
  try {
    const user_id = req.session.user.id;
    const file = req.file;
    console.log("1");
    const { docUrl, pdfUrl, text, fileKey } = await processFile(file, user_id);
    console.log("2");

    const result = await Resume.insertResume(
      user_id,
      fileKey,
      file.mimetype,
      file.originalname,
      text
    );

    res.status(200).json({
      message: "File uploaded successfully",
      docUrl,
      pdfUrl,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error uploading file" });
  }
};

export const downloadController = async (req, res) => {
  try {
    const fileKey = req.params.fileKey;
    const fileBuffer = await downloadFileFromS3(fileKey);

    res.writeHead(200, {
      "Content-Disposition": `attachment; filename=${fileKey}`,
      "Content-Type": "application/octet-stream",
    });

    res.end(fileBuffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error downloading file" });
  }
};
