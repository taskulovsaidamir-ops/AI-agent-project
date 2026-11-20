import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const rawUrl = process.env.TURSO_DATABASE_URL?.trim();
const url = rawUrl && rawUrl.length > 0 ? rawUrl : "file:./local.db";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("http://");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote
    ? {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
      }
    : {
        url,
      },
});
