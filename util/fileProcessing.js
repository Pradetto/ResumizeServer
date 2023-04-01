import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import pdfjsLib from "pdfjs-dist";
import dotenv from "dotenv";
// import unoconv from "unoconv-promise"; HAVE TO UNINSTALL
import s3 from "./s3Config.js";
import textract from "textract";
dotenv.config();

/* PDFJSLIB is meant for client */
async function extractTextFromPDF(buffer) {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}

async function extractTextFromWord(buffer) {
  return new Promise((resolve, reject) => {
    textract.fromBufferWithMime(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer,
      (err, text) => {
        if (err) {
          console.error("Error during text extraction from Word file:", err);
          reject(err);
        } else {
          resolve(text);
        }
      }
    );
  });
}

export async function downloadFileFromS3(fileKey) {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };
  const { Body } = await s3.send(new GetObjectCommand(s3Params));
  return new Promise((resolve, reject) => {
    const chunks = [];
    Body.on("data", (chunk) => {
      chunks.push(chunk);
    });
    Body.on("end", () => {
      const fileBuffer = Buffer.concat(chunks);
      resolve(fileBuffer);
    });
    Body.on("error", (err) => {
      reject(err);
    });
  });
}

async function uploadFileToS3(fileBuffer, fileKey, mimetype) {
  console.log("Uploading file buffer:", fileBuffer);
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ACL: "private",
    ContentType: mimetype,
  };
  await s3.send(new PutObjectCommand(s3Params));
}

export async function processFile(file, userId) {
  let text = "";
  const fileKey = file.key;

  const downloadedFileBuffer = await downloadFileFromS3(fileKey);

  if (file.mimetype === "application/pdf") {
    try {
      text = await extractTextFromPDF(downloadedFileBuffer);
    } catch (err) {
      console.error("could not extract text");
    }
  } else if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    try {
      text = await extractTextFromWord(downloadedFileBuffer);
    } catch (err) {
      console.error("could not extract text");
    }
  }

  return {
    text,
    fileKey,
    filename: file.originalname,
    mimetype: file.mimetype,
  };
}
