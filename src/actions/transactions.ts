"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { toMinorUnits } from "@/lib/money";
import { requireUser } from "@/lib/session";
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "@/lib/validators/transaction";
import type { ActionResult } from "./categories";

export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Ошибка валидации" };
  }

  const { type, amountMajor, categoryId, occurredAt, description } = parsed.data;

  // Verify category belongs to user and matches transaction type
  const cat = await db
    .select({ id: categories.id, type: categories.type })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)))
    .limit(1);

  if (!cat[0]) {
    return { ok: false, error: "Выбранная категория не найдена" };
  }
  if (cat[0].type !== type) {
    return {
      ok: false,
      error: "Тип категории не совпадает с типом операции",
    };
  }

  const amountMinor = toMinorUnits(amountMajor);
  if (amountMinor <= 0) {
    return { ok: false, error: "Сумма должна быть больше 0" };
  }

  const now = new Date();
  const id = randomUUID();

  await db.insert(transactions).values({
    id,
    userId: user.id,
    categoryId,
    type,
    amountMinor,
    description: description ?? "",
    occurredAt,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");

  return { ok: true, data: { id } };
}

export async function updateTransactionAction(
  input: UpdateTransactionInput
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Ошибка валидации" };
  }

  const { id, type, amountMajor, categoryId, occurredAt, description } =
    parsed.data;

  const existing = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    return { ok: false, error: "Операция не найдена" };
  }

  const cat = await db
    .select({ id: categories.id, type: categories.type })
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, user.id)))
    .limit(1);

  if (!cat[0]) {
    return { ok: false, error: "Выбранная категория не найдена" };
  }
  if (cat[0].type !== type) {
    return {
      ok: false,
      error: "Тип категории не совпадает с типом операции",
    };
  }

  const amountMinor = toMinorUnits(amountMajor);
  if (amountMinor <= 0) {
    return { ok: false, error: "Сумма должна быть больше 0" };
  }

  await db
    .update(transactions)
    .set({
      type,
      categoryId,
      amountMinor,
      description: description ?? "",
      occurredAt,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)));

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");

  return { ok: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const user = await requireUser();

  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, user.id)))
    .returning({ id: transactions.id });

  if (!deleted[0]) {
    return { ok: false, error: "Операция не найдена" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/categories");

  return { ok: true };
}
