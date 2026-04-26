import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { image_urls, lang = "fr" } = await request.json();

    if (!image_urls?.length) {
      return NextResponse.json({ error: "Aucune image fournie" }, { status: 400 });
    }

    const res = await fetch(`${process.env.VINTED_API_URL}/test-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_urls, lang }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Erreur generate listing:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
