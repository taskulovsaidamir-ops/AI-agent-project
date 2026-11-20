"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { deleteTransactionAction } from "@/actions/transactions";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { CategoryWithStats } from "@/db/queries/categories";
import type { TransactionWithCategory } from "@/db/queries/transactions";
import type { TransactionType } from "@/db/schema";
import { cn } from "@/lib/cn";
import { formatDateRu } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

interface TransactionsClientProps {
  currency: string;
  items: TransactionWithCategory[];
  total: number;
  page: number;
  totalPages: number;
  categories: CategoryWithStats[];
  initialFilters: {
    from: string;
    to: string;
    type: string;
    categoryId: string;
    search: string;
  };
}

export function TransactionsClient({
  currency,
  items,
  total,
  page,
  totalPages,
  categories,
  initialFilters,
}: TransactionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);
  const [type, setType] = useState(initialFilters.type);
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId);
  const [search, setSearch] = useState(initialFilters.search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(overrides?: Partial<{ page: number }>) {
    const next = new URLSearchParams();
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    if (type) next.set("type", type);
    if (categoryId) next.set("categoryId", categoryId);
    if (search.trim()) next.set("search", search.trim());
    if (overrides?.page && overrides.page > 1) {
      next.set("page", String(overrides.page));
    }
    const qs = next.toString();
    router.push(qs ? `/transactions?${qs}` : "/transactions");
  }

  function resetFilters() {
    setFrom("");
    setTo("");
    setType("");
    setCategoryId("");
    setSearch("");
    router.push("/transactions");
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    const qs = next.toString();
    router.push(qs ? `/transactions?${qs}` : "/transactions");
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить эту операцию?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteTransactionAction(id);
      setDeletingId(null);
    });
  }

  const filteredCategories = type
    ? categories.filter((c) => c.type === (type as TransactionType))
    : categories;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Операции</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Всего найдено: <span className="font-semibold">{total}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)]"
        >
          <Plus className="h-4 w-4" />
          Добавить операцию
        </button>
      </div>

      {/* Filters Card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ page: 1 });
        }}
        className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-2xs"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              От даты
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              До даты
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Тип
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCategoryId("");
              }}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">Все типы</option>
              <option value="expense">Расходы</option>
              <option value="income">Доходы</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Категория
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">Все категории</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isArchived ? " (архив)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              Поиск по описанию
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Кофе, аренда..."
                className="w-full rounded-xl border border-[var(--border-default)] py-2 pr-3 pl-9 text-sm outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Сбросить
          </button>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Применить фильтры
          </button>
        </div>
      </form>

      {/* Transactions List */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-2xs">
        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Операции не найдены
            </p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Добавить первую операцию
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {items.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col gap-3 px-5 py-3.5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                    style={{ backgroundColor: tx.categoryColor }}
                  >
                    <CategoryIcon name={tx.categoryIcon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {tx.categoryName}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          tx.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {tx.type === "income" ? "Доход" : "Расход"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                      {formatDateRu(tx.occurredAt)}
                      {tx.description ? ` · ${tx.description}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span
                    className={cn(
                      "tabular-nums text-base font-bold",
                      tx.type === "income"
                        ? "text-[var(--income)]"
                        : "text-[var(--expense)]"
                    )}
                  >
                    {formatMoney(tx.amountMinor, currency, { type: tx.type })}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(tx);
                        setModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending && deletingId === tx.id}
                      onClick={() => handleDelete(tx.id)}
                      className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-red-50 hover:text-[var(--danger)] disabled:opacity-50"
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-secondary)]">
            Страница {page} из {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              Вперёд
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        categories={categories}
        editing={editing}
      />
    </div>
  );
}
