import { downloadFileFromS3 } from "./fileProcessing.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./s3Config.js";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export const generateCoverLetter = async (userId, templateData) => {
  const fileKey = "template.docx";
  const mimetype =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  try {
    const templateFile = await downloadFileFromS3(fileKey);

    const template = new PizZip(templateFile);
    const doc = new Docxtemplater(template);
    doc.setData(templateData);
    doc.render();

    const output = doc.getZip().generate({ type: "nodebuffer" });
    const outputKey = `${userId}/cover_letters/${Date.now()} ${
      templateData.user.firstname
    } ${templateData.user.lastname} ${
      templateData.required_employer.company_name
    } ${templateData.required_employer.role} Cover Letter.docx`;
    await uploadGeneratedFileToS3(output, outputKey, mimetype);

    return { key: outputKey, mimetype };
  } catch (err) {
    console.error("Error generating cover letter:", err);
    throw err;
  }
};

export async function uploadGeneratedFileToS3(buffer, fileKey, contentType) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
    ACL: "private",
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    console.log(`Successfully uploaded file: ${fileKey}`);
    return fileKey;
  } catch (err) {
    console.error(`Error uploading file: ${fileKey}`, err);
    throw err;
  }
}
