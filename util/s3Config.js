// s3Config.js
import { S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: fromIni({
    profile: process.env.AWS_PROFILE,
  }),
});

export default s3;
