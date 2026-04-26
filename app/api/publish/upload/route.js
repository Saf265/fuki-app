import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images");

    if (!files.length) {
      return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    }

    const urls = await Promise.all(
      files.map(async (image) => {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = image.name.split(".").pop() || "jpg";
        const fileName = `publish/${timestamp}-${randomStr}.${ext}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: image.type,
          })
        );

        return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`;
      })
    );

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("❌ Erreur upload publish:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
