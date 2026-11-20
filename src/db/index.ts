import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const rawUrl = process.env.TURSO_DATABASE_URL?.trim();
const databaseUrl = rawUrl && rawUrl.length > 0 ? rawUrl : "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;

export const isRemoteTurso =
  databaseUrl.startsWith("libsql://") ||
  databaseUrl.startsWith("https://") ||
  databaseUrl.startsWith("http://");

const globalForDb = globalThis as unknown as {
  libsqlClient?: Client;
};

export const client =
  globalForDb.libsqlClient ??
  createClient(
    isRemoteTurso
      ? { url: databaseUrl, authToken }
      : { url: databaseUrl }
  );

if (process.env.NODE_ENV !== "production") {
  globalForDb.libsqlClient = client;
}

export const db = drizzle(client, { schema });
