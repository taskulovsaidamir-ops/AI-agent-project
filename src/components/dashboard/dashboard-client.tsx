"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Scale,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { CategoryIcon } from "@/components/ui/category-icon";
import type {
  CashflowPoint,
  CategoryBreakdownItem,
  PeriodSummary,
} from "@/db/queries/analytics";
import type { CategoryWithStats } from "@/db/queries/categories";
import type { TransactionWithCategory } from "@/db/queries/transactions";
import type { TransactionType } from "@/db/schema";
import { cn } from "@/lib/cn";
import {
  formatDateRu,
  formatMonthLabel,
  formatShortDay,
  shiftMonthKey,
} from "@/lib/dates";
import { formatMoney, fromMinorUnits } from "@/lib/money";

interface DashboardClientProps {
  monthKey: string;
  currency: string;
  summary: PeriodSummary;
  expenseBreakdown: CategoryBreakdownItem[];
  incomeBreakdown: CategoryBreakdownItem[];
  cashflow: CashflowPoint[];
  recentTransactions: TransactionWithCategory[];
  categories: CategoryWithStats[];
}

export function DashboardClient({
  monthKey,
  currency,
  summary,
  expenseBreakdown,
  incomeBreakdown,
  cashflow,
  recentTransactions,
  categories,
}: DashboardClientProps) {
  const router = useRouter();
  const [breakdownTab, setBreakdownTab] = useState<TransactionType>("expense");
  const [modalOpen, setModalOpen] = useState(false);

  const activeBreakdown =
    breakdownTab === "expense" ? expenseBreakdown : incomeBreakdown;

  const chartCashflow = cashflow.map((point) => ({
    label: formatShortDay(point.date),
    Доходы: fromMinorUnits(point.incomeMinor),
    Расходы: fromMinorUnits(point.expenseMinor),
  }));

  function goToMonth(nextMonth: string) {
    router.push(`/dashboard?month=${nextMonth}`);
  }

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Дашборд</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Сводка доходов, расходов и структуры категорий
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => goToMonth(shiftMonthKey(monthKey, -1))}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] px-3 text-center text-sm font-semibold">
              {formatMonthLabel(monthKey)}
            </span>
            <button
              type="button"
              onClick={() => goToMonth(shiftMonthKey(monthKey, 1))}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            Добавить операцию
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Доходы за период"
          value={formatMoney(summary.totalIncomeMinor, currency)}
          icon={<ArrowUpRight className="h-5 w-5 text-[var(--income)]" />}
          iconBg="bg-emerald-50"
          valueClass="text-[var(--income)]"
        />
        <KpiCard
          title="Расходы за период"
          value={formatMoney(summary.totalExpenseMinor, currency)}
          icon={<ArrowDownRight className="h-5 w-5 text-[var(--expense)]" />}
          iconBg="bg-red-50"
          valueClass="text-[var(--expense)]"
        />
        <KpiCard
          title="Баланс периода"
          value={formatMoney(summary.periodBalanceMinor, currency, {
            showSign: true,
          })}
          icon={<Scale className="h-5 w-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
          valueClass={
            summary.periodBalanceMinor >= 0
              ? "text-[var(--text-primary)]"
              : "text-[var(--expense)]"
          }
        />
        <KpiCard
          title="Общий баланс"
          value={formatMoney(summary.allTimeBalanceMinor, currency)}
          icon={<Wallet className="h-5 w-5 text-slate-700" />}
          iconBg="bg-slate-100"
          valueClass="text-[var(--text-primary)]"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cashflow Dynamics */}
        <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-2xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Динамика за период</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Сравнение доходов и расходов по датам
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--income)]" />
                Доходы
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--expense)]" />
                Расходы
              </span>
            </div>
          </div>

          {chartCashflow.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] text-center">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Нет операций за этот период
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-2 text-xs font-semibold text-[var(--accent-primary)] hover:underline"
              >
                Добавить первую операцию
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartCashflow} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip
                    formatter={(val: number) =>
                      formatMoney(Math.round(val * 100), currency)
                    }
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#e2e8f0",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="Доходы"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="Расходы"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Breakdown by Category */}
        <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-2xs lg:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">По категориям</h2>
            <div className="flex rounded-lg bg-[var(--bg-surface-muted)] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBreakdownTab("expense")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition",
                  breakdownTab === "expense"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                    : "text-[var(--text-secondary)]"
                )}
              >
                Расходы
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab("income")}
                className={cn(
                  "rounded-md px-2.5 py-1 transition",
                  breakdownTab === "income"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs"
                    : "text-[var(--text-secondary)]"
                )}
              >
                Доходы
              </button>
            </div>
          </div>

          {activeBreakdown.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[var(--border-default)] text-sm text-[var(--text-secondary)]">
              Нет данных по выбранному типу
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeBreakdown}
                      dataKey="totalMinor"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                    >
                      {activeBreakdown.map((item) => (
                        <Cell key={item.categoryId} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) =>
                        formatMoney(Number(val), currency)
                      }
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "#e2e8f0",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {activeBreakdown.map((item) => (
                  <div
                    key={item.categoryId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className="tabular-nums flex shrink-0 items-center gap-2 pl-2">
                      <span className="font-semibold">
                        {formatMoney(item.totalMinor, currency)}
                      </span>
                      <span className="w-11 text-right text-xs text-[var(--text-secondary)]">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Последние операции</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Операции за {formatMonthLabel(monthKey).toLowerCase()}
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)] hover:underline"
          >
            Все операции
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border-default)] py-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              В этом месяце пока нет записей
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: tx.categoryColor }}
                  >
                    <CategoryIcon name={tx.categoryIcon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {tx.categoryName}
                    </p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {tx.description || formatDateRu(tx.occurredAt)}
                      {tx.description ? ` · ${formatDateRu(tx.occurredAt)}` : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "tabular-nums shrink-0 text-sm font-bold",
                    tx.type === "income"
                      ? "text-[var(--income)]"
                      : "text-[var(--expense)]"
                  )}
                >
                  {formatMoney(tx.amountMinor, currency, { type: tx.type })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  iconBg,
  valueClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {title}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          "tabular-nums mt-3 text-2xl font-bold tracking-tight",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
