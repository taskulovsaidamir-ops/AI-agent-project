import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions, type TransactionType } from "@/db/schema";

export interface PeriodSummary {
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  periodBalanceMinor: number;
  allTimeBalanceMinor: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  totalMinor: number;
  percentage: number;
}

export interface CashflowPoint {
  date: string;
  incomeMinor: number;
  expenseMinor: number;
}

export async function getPeriodSummary(
  userId: string,
  from: string,
  to: string
): Promise<PeriodSummary> {
  const [periodRows, allTimeRows] = await Promise.all([
    db
      .select({
        type: transactions.type,
        total: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to)
        )
      )
      .groupBy(transactions.type),
    db
      .select({
        type: transactions.type,
        total: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(transactions.type),
  ]);

  let totalIncomeMinor = 0;
  let totalExpenseMinor = 0;
  for (const r of periodRows) {
    if (r.type === "income") totalIncomeMinor = Number(r.total ?? 0);
    if (r.type === "expense") totalExpenseMinor = Number(r.total ?? 0);
  }

  let allIncome = 0;
  let allExpense = 0;
  for (const r of allTimeRows) {
    if (r.type === "income") allIncome = Number(r.total ?? 0);
    if (r.type === "expense") allExpense = Number(r.total ?? 0);
  }

  return {
    totalIncomeMinor,
    totalExpenseMinor,
    periodBalanceMinor: totalIncomeMinor - totalExpenseMinor,
    allTimeBalanceMinor: allIncome - allExpense,
  };
}

export async function getBreakdownByCategory(
  userId: string,
  from: string,
  to: string,
  type: TransactionType
): Promise<CategoryBreakdownItem[]> {
  const rows = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      totalMinor: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, type),
        gte(transactions.occurredAt, from),
        lte(transactions.occurredAt, to)
      )
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`SUM(${transactions.amountMinor})`));

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.totalMinor ?? 0), 0);

  return rows.map((row) => {
    const total = Number(row.totalMinor ?? 0);
    return {
      categoryId: row.categoryId,
      name: row.name,
      color: row.color,
      icon: row.icon,
      totalMinor: total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 1000) / 10 : 0,
    };
  });
}

export async function getCashflowSeries(
  userId: string,
  from: string,
  to: string
): Promise<CashflowPoint[]> {
  const rows = await db
    .select({
      date: transactions.occurredAt,
      type: transactions.type,
      total: sql<number>`COALESCE(SUM(${transactions.amountMinor}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, from),
        lte(transactions.occurredAt, to)
      )
    )
    .groupBy(transactions.occurredAt, transactions.type)
    .orderBy(transactions.occurredAt);

  const map = new Map<string, CashflowPoint>();
  for (const row of rows) {
    const existing = map.get(row.date) ?? {
      date: row.date,
      incomeMinor: 0,
      expenseMinor: 0,
    };
    if (row.type === "income") {
      existing.incomeMinor = Number(row.total ?? 0);
    } else {
      existing.expenseMinor = Number(row.total ?? 0);
    }
    map.set(row.date, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
