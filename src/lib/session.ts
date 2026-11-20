import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  currency: string;
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      currency: userTable.currency,
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  return rows[0] ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login");
  }
  return current;
}
