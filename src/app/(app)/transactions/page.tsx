import { TransactionsClient } from "@/components/transactions/transactions-client";
import { getUserCategories } from "@/db/queries/categories";
import { getUserTransactions } from "@/db/queries/transactions";
import type { TransactionType } from "@/db/schema";
import { requireUser } from "@/lib/session";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    type?: string;
    categoryId?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const validType: TransactionType | undefined =
    params.type === "income" || params.type === "expense"
      ? params.type
      : undefined;

  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [result, categories] = await Promise.all([
    getUserTransactions(user.id, {
      from: params.from || undefined,
      to: params.to || undefined,
      type: validType,
      categoryId: params.categoryId || undefined,
      search: params.search || undefined,
      page,
      pageSize: 20,
    }),
    getUserCategories(user.id, { includeArchived: true }),
  ]);

  return (
    <TransactionsClient
      currency={user.currency}
      items={result.items}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      categories={categories}
      initialFilters={{
        from: params.from ?? "",
        to: params.to ?? "",
        type: validType ?? "",
        categoryId: params.categoryId ?? "",
        search: params.search ?? "",
      }}
    />
  );
}
