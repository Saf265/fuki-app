const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

async function upload() {
  const files = ["brands.json", "sizes.json", "statutuses.json"];

  for (const file of files) {
    const filePath = path.join(process.cwd(), "public", file);
    const content = fs.readFileSync(filePath, "utf-8");

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: `data/${file}`,
        Body: content,
        ContentType: "application/json",
      })
    );

    console.log(`✅ Uploaded ${file}`);
  }

  console.log("\n🎉 All files uploaded to R2!");
}

upload().catch(console.error);
