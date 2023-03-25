import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import dotenv from "dotenv";
// import unoconv from "unoconv-promise"; HAVE TO UNINSTALL
import s3 from "./s3Config.js";
dotenv.config();

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
  console.log("Extracting text from Word file", file);
  const arrayBuffer = new Uint8Array(file.buffer).buffer; // <-- Convert Buffer to ArrayBuffer
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function downloadFileFromS3(fileKey) {
  console.log("Attempting to download file with key Download:", fileKey);
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };
  const { Body } = await s3.send(new GetObjectCommand(s3Params));
  return Body;
  // return new Promise((resolve, reject) => {
  //   const chunks = [];
  //   Body.on("data", (chunk) => {
  //     chunks.push(chunk);
  //   });
  //   Body.on("end", () => {
  //     const fileBuffer = Buffer.concat(chunks);
  //     console.log("Downloaded file buffer:", fileBuffer);
  //     resolve(fileBuffer);
  //   });
  //   Body.on("error", (err) => {
  //     reject(err);
  //   });
  // });
}

async function uploadFileToS3(fileBuffer, fileKey, mimetype) {
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

  const fileKey = userId + "/" + Date.now() + "-" + file.originalname;

  await uploadFileToS3(file.buffer, fileKey, file.mimetype);

  if (file.mimetype === "application/pdf") {
    try {
      text = await extractTextFromPDF(file);
    } catch (err) {
      console.error("could not extract text");
    }
  } else if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    try {
      text = await extractTextFromWord(file);
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

// export async function processFile(file, userId) {
//   // console.log("Processing file", file);

//   let docUrl = "";
//   let pdfUrl = "";
//   let text = "";

//   const fileKey =
//     userId + "/" + Date.now() + "-" + file.originalname.replace(" ", "");

//   const res = await uploadFileToS3(file.buffer, fileKey, file.mimetype);
//   console.log(res);

//   const fileBuffer = await downloadFileFromS3(fileKey);

//   // const fileBuffer = file.buffer;
//   // console.log("file buffer", fileBuffer);

//   if (file.mimetype === "application/pdf") {
//     pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
//     text = await extractTextFromPDF(fileBuffer); // <-- Change from file to fileBuffer

//     const wordBuffer = await convertPdfToWord(fileBuffer);
//     const wordKey = fileKey.replace(/\.(pdf|doc)$/, ".docx");
//     await uploadFileToS3(
//       wordBuffer,
//       wordKey,
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
//     );

//     docUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${wordKey}`;
//   } else if (
//     file.mimetype ===
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
//     file.mimetype === "application/msword"
//   ) {
//     docUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
//     text = await extractTextFromWord(fileBuffer); // <-- Change from file to fileBuffer

//     const pdfBuffer = await convertWordToPdf(fileBuffer);
//     const pdfKey = fileKey.replace(/\.(docx|doc)$/, ".pdf");
//     await uploadFileToS3(pdfBuffer, pdfKey, "application/pdf");

//     pdfUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${pdfKey}`;
//   }

//   return {
//     docUrl,
//     pdfUrl,
//     text,
//     fileKey,
//   };
// }

// async function convertWordToPdf(buffer) {
//   const pdfBuffer = await unoconv.convert(buffer, "pdf");
//   return pdfBuffer;
// }

// async function convertPdfToWord(buffer) {
//   const wordBuffer = await unoconv.convert(buffer, "docx");
//   return wordBuffer;
// }

// FYI

// Note that running unoconv requires LibreOffice to be installed on your server. If you are deploying your application on Heroku, you can use the heroku-buildpack-apt and heroku-buildpack-unoconv buildpacks to install the necessary dependencies. Add the buildpacks to your Heroku app:

// bash
// Copy code
// heroku buildpacks:add --index 1 heroku-community/apt
// heroku buildpacks:add
