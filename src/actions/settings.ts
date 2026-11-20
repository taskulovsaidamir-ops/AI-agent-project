"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { requireUser } from "@/lib/session";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/settings";
import type { ActionResult } from "./categories";

export async function updateProfileSettingsAction(
  input: UpdateProfileInput
): Promise<ActionResult> {
  const currentUser = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Ошибка валидации",
    };
  }

  await db
    .update(userTable)
    .set({
      name: parsed.data.name,
      currency: parsed.data.currency,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, currentUser.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");

  return { ok: true };
}
