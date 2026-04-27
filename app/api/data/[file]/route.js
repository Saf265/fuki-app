import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const R2_BASE = "https://pub-447d488e350b4fd987abb56665618bf9.r2.dev/datasets-vinted";

// Cache en mémoire par locale (1h)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60;

export async function GET(request, { params }) {
  try {
    const { file } = await params;
    const { searchParams } = new URL(request.url);
    const queryLocale = searchParams.get("lang");

    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("locale")?.value;

    // Priority: query param > cookie > default
    const locale = queryLocale || cookieLocale || "fr";

    // brands.json n'a pas de locale
    const needsLocale = ["colors.json", "sizes.json", "statuses.json", "groups.json", "package-sizes.json"].includes(file);

    if (!["brands.json", "colors.json", "sizes.json", "statuses.json", "groups.json", "package-sizes.json"].includes(file)) {
      return NextResponse.json({ error: "File not allowed" }, { status: 400 });
    }

    const cacheKey = `${file}-${locale}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Construire l'URL R2
    const url = needsLocale
      ? `${R2_BASE}/${locale}/${file}`
      : `${R2_BASE}/${file}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${file} from R2: ${res.status}`);

    const data = await res.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Erreur fetch data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
