"use server";

import { randomUUID } from "crypto";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { requireUser } from "@/lib/session";
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validators/category";

export interface ActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Ошибка валидации" };
  }

  const { name, type, color, icon } = parsed.data;

  // Check duplicates case-insensitively for this user + type
  const existing = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.userId, user.id), eq(categories.type, type)));

  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: "Категория с таким названием уже существует" };
  }

  const now = new Date();
  const id = randomUUID();
  await db.insert(categories).values({
    id,
    userId: user.id,
    name,
    type,
    color,
    icon,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return { ok: true, data: { id } };
}

export async function updateCategoryAction(
  input: UpdateCategoryInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Ошибка валидации" };
  }

  const { id, name, color, icon } = parsed.data;

  const target = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .limit(1);

  if (!target[0]) {
    return { ok: false, error: "Категория не найдена" };
  }

  const siblings = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(
      and(
        eq(categories.userId, user.id),
        eq(categories.type, target[0].type)
      )
    );

  if (
    siblings.some(
      (c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase()
    )
  ) {
    return { ok: false, error: "Категория с таким названием уже существует" };
  }

  await db
    .update(categories)
    .set({ name, color, icon, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function deleteOrArchiveCategoryAction(
  id: string
): Promise<ActionResult<{ mode: "deleted" | "archived" }>> {
  const user = await requireUser();

  const target = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .limit(1);

  if (!target[0]) {
    return { ok: false, error: "Категория не найдена" };
  }

  const txCountRow = await db
    .select({ total: count() })
    .from(transactions)
    .where(
      and(eq(transactions.categoryId, id), eq(transactions.userId, user.id))
    );

  const txCount = Number(txCountRow[0]?.total ?? 0);

  if (txCount > 0) {
    await db
      .update(categories)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    return { ok: true, data: { mode: "archived" } };
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)));

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");

  return { ok: true, data: { mode: "deleted" } };
}

export async function restoreCategoryAction(id: string): Promise<ActionResult> {
  const user = await requireUser();

  const updated = await db
    .update(categories)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, user.id)))
    .returning({ id: categories.id });

  if (!updated[0]) {
    return { ok: false, error: "Категория не найдена" };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}
