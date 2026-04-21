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
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    console.log("📸 Image reçue:", {
      name: image.name,
      type: image.type,
      size: `${(image.size / 1024).toFixed(2)} KB`,
    });

    // Convertir en buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Générer un nom unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = image.name.split(".").pop() || "jpg";
    const fileName = `messages/${timestamp}-${randomStr}.${ext}`;

    console.log("☁️ Upload vers R2:", fileName);

    // Upload vers Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: image.type,
      })
    );

    // Construire l'URL publique
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`;

    console.log("✅ Image uploadée:", publicUrl);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("❌ Erreur upload:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
