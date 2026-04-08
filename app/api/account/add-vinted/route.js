import { db } from "@/db/drizzle";
import { connectedAccounts } from "@/db/drizzle/schema";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(req) {
  const {
    vintedUsername,
    access_token,
    refresh_token,
    userId,
    gaClientId,
    domain,
  } = await req.json();

  if (
    !vintedUsername ||
    !access_token ||
    !refresh_token ||
    !userId ||
    !domain
  ) {
    return NextResponse.json({ success: false, error: "Missing credentials" });
  }
  console.log("DATA----------------");
  console.log({ vintedUsername, access_token, refresh_token, userId, domain });

  const randomId = nanoid();

  const resp = await fetch(
    "https://stingray-app-xoed8.ondigitalocean.app/api/link",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: access_token,
        domain: domain,
      }),
    },
  );
  console.log(resp);
  if (!resp.ok) {
    return NextResponse.json({
      success: false,
      error: "Failed to link account",
    });
  }
  const data = await resp.json();
  console.log(data.user);
  console.log(data);
  try {
    await db.insert(connectedAccounts).values({
      id: randomId,
      userId: userId,
      platform: "vinted",
      firstName: vintedUsername,
      lastName: null,
      platformUserId: data.user.id, // ça
      accessToken: access_token,
      refreshToken: refresh_token,
      gaClientId: gaClientId,
      accessTokenExpiresAt: null, // ça
      createdAt: new Date(),
      updatedAt: new Date(),

      // add
      domain: domain,
    });

    return NextResponse.json({
      success: true,
      message: "Vinted account added successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
