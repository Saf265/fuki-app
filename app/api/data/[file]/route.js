import { NextResponse } from "next/server";

const R2_BASE = process.env.CLOUDFLARE_R2_PUBLIC_URL;

const FILE_MAP = {
  "brands.json": "data/brands.json",
  "sizes.json": "data/sizes.json",
  "statutuses.json": "data/statuses.json",
  "colors.json": "data/colors.json",
};

// Cache en mémoire (1h)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60;

export async function GET(_, { params }) {
  try {
    const { file } = await params;

    if (!FILE_MAP[file]) {
      return NextResponse.json({ error: "File not allowed" }, { status: 400 });
    }

    const cached = cache.get(file);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const url = `${R2_BASE}/${FILE_MAP[file]}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Failed to fetch ${file} from R2: ${res.status}`);

    const data = await res.json();
    cache.set(file, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Erreur fetch data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
