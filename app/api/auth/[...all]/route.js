import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Authentication system disabled", { status: 404 });
}

export async function POST() {
  return new NextResponse("Authentication system disabled", { status: 404 });
}
