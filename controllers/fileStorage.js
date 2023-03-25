import { processFile } from "../util/fileProcessing.js";
import Resume from "../models/Resume.js";

export const uploadController = async (req, res) => {
  const user_id = req.session.user.id;
  const file = req.file;

  try {
    const { docUrl, pdfUrl, text } = await processFile(file, user_id);

    await Resume.insertResume(user_id, docUrl, pdfUrl, text);

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
