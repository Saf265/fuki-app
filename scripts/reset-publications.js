import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

await sql`DROP TABLE IF EXISTS "publication_accounts" CASCADE`;
await sql`DROP TABLE IF EXISTS "publications" CASCADE`;

console.log("✅ Tables dropped successfully");
