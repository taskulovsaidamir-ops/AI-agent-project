import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions, type TransactionType } from "@/db/schema";

export interface CategoryWithStats {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isArchived: boolean;
  transactionCount: number;
}

export async function getUserCategories(
  userId: string,
  options?: {
    type?: TransactionType;
    includeArchived?: boolean;
  }
): Promise<CategoryWithStats[]> {
  const conditions = [eq(categories.userId, userId)];

  if (options?.type) {
    conditions.push(eq(categories.type, options.type));
  }
  if (!options?.includeArchived) {
    conditions.push(eq(categories.isArchived, false));
  }

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      color: categories.color,
      icon: categories.icon,
      isArchived: categories.isArchived,
      transactionCount: count(transactions.id),
    })
    .from(categories)
    .leftJoin(transactions, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .groupBy(categories.id)
    .orderBy(asc(categories.isArchived), asc(categories.name));

  return rows.map((row) => ({
    ...row,
    transactionCount: Number(row.transactionCount ?? 0),
  }));
}
