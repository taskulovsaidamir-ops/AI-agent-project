import { and, count, desc, eq, gte, like, lte } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions, type TransactionType } from "@/db/schema";

export interface TransactionWithCategory {
  id: string;
  type: TransactionType;
  amountMinor: number;
  description: string;
  occurredAt: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  categoryArchived: boolean;
}

export interface TransactionFilterParams {
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getUserTransactions(
  userId: string,
  filters: TransactionFilterParams = {}
): Promise<{
  items: TransactionWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(transactions.userId, userId)];

  if (filters.from) {
    conditions.push(gte(transactions.occurredAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(transactions.occurredAt, filters.to));
  }
  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters.categoryId) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters.search?.trim()) {
    conditions.push(like(transactions.description, `%${filters.search.trim()}%`));
  }

  const whereClause = and(...conditions);

  const [totalRow, rows] = await Promise.all([
    db.select({ total: count() }).from(transactions).where(whereClause),
    db
      .select({
        id: transactions.id,
        type: transactions.type,
        amountMinor: transactions.amountMinor,
        description: transactions.description,
        occurredAt: transactions.occurredAt,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        categoryArchived: categories.isArchived,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages,
  };
}
