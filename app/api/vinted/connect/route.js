import CryptoJS from "crypto-js";
import { NextResponse } from "next/server";
import { chromium } from "playwright";

export async function POST(request) {
  try {
    const {
      email: encryptedEmail,
      password: encryptedPassword,
      userId,
    } = await request.json();

    if (!encryptedEmail || !encryptedPassword) {
      return NextResponse.json(
        { error: "Missing encrypted credentials" },
        { status: 400 },
      );
    }

    const secretKey =
      process.env.NEXT_PUBLIC_CRYPTO_SECRET || "fuki-secret-key";

    // Decrypt credentials
    const emailBytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
    const email = emailBytes.toString(CryptoJS.enc.Utf8);

    const passwordBytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
    const password = passwordBytes.toString(CryptoJS.enc.Utf8);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Failed to decrypt credentials" },
        { status: 400 },
      );
    }

    // Launch Playwright in the background
    // This runs asynchronously without blocking the API response
    runPlaywright(email, password, userId).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Playwright login task started",
    });
  } catch (error) {
    console.error("Vinted Connect API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runPlaywright(email, password, userId) {
  console.log(
    `[Playwright Worker] Starting login sequence for userId: ${userId}`,
  );

  let browser;
  try {
    // Note: headful might be needed if there are captchas, but headless:false to show the user
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    console.log(`[Playwright Worker] Navigating to Vinted...`);
    // Navigates to a known Vinted login endpoint or homepage
    await page.goto("https://www.vinted.com/member/signup/select_type");

    // Simulate wait for elements and filling the data
    console.log(
      `[Playwright Worker] Attempting to fill credentials for ${email}...`,
    );

    await page.waitForTimeout(100000);

    await page.getByRole("button", { name: "email" }).click();
    /* 
      Real Vinted selector logic:
      await page.click('button[data-testid="header--login-button"]');
      await page.fill('input[name="login"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
    */

    // Mock the delay to represent the sequence in background
    await page.waitForTimeout(5000);

    console.log(`[Playwright Worker] Process finished for ${email}`);
  } catch (e) {
    console.error(`[Playwright Worker] Automation Error:`, e);
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[Playwright Worker] Browser closed.`);
    }
  }
}
