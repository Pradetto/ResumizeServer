// import { getDocument } from "pdfjs-dist";
import pdfjsLib from "pdfjs-dist";

import mammoth from "mammoth";

async function extractTextFromPDF(file) {
  const pdf = await pdfjsLib.getDocument({ data: file.buffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}

async function extractTextFromWord(file) {
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return result.value;
}

export async function processFile(file, userId) {
  let docUrl = "";
  let pdfUrl = "";
  let text = "";

  const fileKey = userId + "/" + Date.now() + "-" + file.originalname;

  if (file.mimetype === "application/pdf") {
    pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    text = await extractTextFromPDF(file);
    // Convert PDF to Word and upload to S3
  } else if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    docUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
    text = await extractTextFromWord(file);
    // Convert Word to PDF and upload to S3
  }

  return {
    docUrl,
    pdfUrl,
    text,
  };
}
