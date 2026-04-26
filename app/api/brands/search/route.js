import { NextResponse } from "next/server";

const R2_BASE = "https://pub-447d488e350b4fd987abb56665618bf9.r2.dev/datasets-vinted";

// Cache en mémoire (1h)
let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60;

async function getBrands() {
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL) return cache;

  const res = await fetch(`${R2_BASE}/brands.json`);
  if (!res.ok) throw new Error(`R2 fetch failed: ${res.status}`);

  const data = await res.json();
  cache = Object.entries(data).map(([label, id]) => ({ label, id: String(id) }));
  cacheTimestamp = Date.now();
  return cache;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    const allBrands = await getBrands();

    let results = query
      ? allBrands.filter((b) => b.label.toLowerCase().includes(query))
      : allBrands;

    results = results.slice(0, limit);

    return NextResponse.json({ brands: results });
  } catch (error) {
    console.error("❌ Erreur search brands:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
