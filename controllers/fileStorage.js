import { processFile } from "../util/fileProcessing.js";
import Resume from "../models/Resume.js";
import { downloadFileFromS3 } from "../util/fileProcessing.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../util/s3Config.js";
import CoverLetter from "../models/CoverLetter.js";

export const uploadController = async (req, res) => {
  try {
    const user_id = req.session.user.id;
    const file = req.file;
    const isDefault = Boolean(Number(req.body.isDefault));
    const { filename, text, fileKey, mimetype } = await processFile(file);

    const result = await Resume.insertResume(
      user_id,
      fileKey,
      mimetype,
      filename,
      text,
      isDefault
    );

    res.status(200).json({
      message: "File uploaded successfully",
      fileKey,
      filename,
      text,
      isDefault,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: `Error uploading file: ${err.message}` });
  }
};

export const downloadController = async (req, res) => {
  const fileKey = req.query.file_key;
  const userId = req.session.user.id;
  try {
    // I Don't have to expose the whole object here can just do the file_type
    const file_info = fileKey.includes("cover_letters")
      ? await CoverLetter.findByUserIdAndFileKey(userId, fileKey)
      : await Resume.findByUserIdAndFileKey(userId, fileKey);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });
    res.status(200).json({ url, file_info });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error downloading file" });
  }
};

export const downloadDefaultController = async (req, res) => {
  try {
    const fileKey = req.query.file_key;
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });
    res.status(200).json({ url });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Error downloading file" });
  }
};

export async function deleteFile(key) {
  console.log("\nDELETING FILE", key);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    const response = await s3.send(command);
    return `Successfully deleted file: ${key}`;
  } catch (err) {
    console.error(`Error deleting file: ${key}`, err);
  }
}
