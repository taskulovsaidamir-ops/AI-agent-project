import { DashboardClient } from "@/components/dashboard/dashboard-client";
import {
  getBreakdownByCategory,
  getCashflowSeries,
  getPeriodSummary,
} from "@/db/queries/analytics";
import { getUserCategories } from "@/db/queries/categories";
import { getUserTransactions } from "@/db/queries/transactions";
import {
  getCurrentMonthKey,
  getMonthRange,
  isValidMonthKey,
} from "@/lib/dates";
import { requireUser } from "@/lib/session";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const monthKey = isValidMonthKey(params.month)
    ? params.month
    : getCurrentMonthKey();
  const { from, to } = getMonthRange(monthKey);

  const [
    summary,
    expenseBreakdown,
    incomeBreakdown,
    cashflow,
    recent,
    categories,
  ] = await Promise.all([
    getPeriodSummary(user.id, from, to),
    getBreakdownByCategory(user.id, from, to, "expense"),
    getBreakdownByCategory(user.id, from, to, "income"),
    getCashflowSeries(user.id, from, to),
    getUserTransactions(user.id, { from, to, page: 1, pageSize: 6 }),
    getUserCategories(user.id, { includeArchived: true }),
  ]);

  return (
    <DashboardClient
      monthKey={monthKey}
      currency={user.currency}
      summary={summary}
      expenseBreakdown={expenseBreakdown}
      incomeBreakdown={incomeBreakdown}
      cashflow={cashflow}
      recentTransactions={recent.items}
      categories={categories}
    />
  );
}
