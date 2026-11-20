"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/actions/transactions";
import { Modal } from "@/components/ui/modal";
import type { CategoryWithStats } from "@/db/queries/categories";
import type { TransactionWithCategory } from "@/db/queries/transactions";
import type { TransactionType } from "@/db/schema";
import { cn } from "@/lib/cn";
import { getTodayIso } from "@/lib/dates";
import { fromMinorUnits } from "@/lib/money";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithStats[];
  editing?: TransactionWithCategory | null;
  defaultType?: TransactionType;
}

export function TransactionModal({
  open,
  onClose,
  categories,
  editing,
  defaultType = "expense",
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(
    editing?.type ?? defaultType
  );
  const [amount, setAmount] = useState(
    editing ? String(fromMinorUnits(editing.amountMinor)) : ""
  );
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [occurredAt, setOccurredAt] = useState(
    editing?.occurredAt ?? getTodayIso()
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.type === type && (!c.isArchived || c.id === editing?.categoryId)
      ),
    [categories, type, editing?.categoryId]
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type);
      setAmount(String(fromMinorUnits(editing.amountMinor)));
      setCategoryId(editing.categoryId);
      setOccurredAt(editing.occurredAt);
      setDescription(editing.description);
    } else {
      setType(defaultType);
      setAmount("");
      const firstMatch = categories.find(
        (c) => c.type === defaultType && !c.isArchived
      );
      setCategoryId(firstMatch?.id ?? "");
      setOccurredAt(getTodayIso());
      setDescription("");
    }
  }, [open, editing, defaultType, categories]);

  function handleTypeSwitch(nextType: TransactionType) {
    setType(nextType);
    const firstMatch = categories.find(
      (c) => c.type === nextType && !c.isArchived
    );
    setCategoryId(firstMatch?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Введите сумму больше нуля");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }

    startTransition(async () => {
      const payload = {
        type,
        amountMajor: parsedAmount,
        categoryId,
        occurredAt,
        description,
      };

      const res = editing
        ? await updateTransactionAction({ id: editing.id, ...payload })
        : await createTransactionAction(payload);

      if (!res.ok) {
        setError(res.error ?? "Не удалось сохранить операцию");
        return;
      }

      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Редактировать операцию" : "Новая операция"}
      description="Укажите сумму, категорию и дату"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Segmented Control */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--bg-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => handleTypeSwitch("expense")}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition",
              type === "expense"
                ? "bg-[var(--bg-surface)] text-[var(--expense)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Расход
          </button>
          <button
            type="button"
            onClick={() => handleTypeSwitch("income")}
            className={cn(
              "rounded-lg py-2 text-sm font-semibold transition",
              type === "income"
                ? "bg-[var(--bg-surface)] text-[var(--income)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Доход
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Сумма</label>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-lg font-semibold outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Категория</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isArchived ? " (архив)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Дата</label>
          <input
            type="date"
            required
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Комментарий <span className="text-[var(--text-secondary)]">(необязательно)</span>
          </label>
          <input
            type="text"
            maxLength={255}
            placeholder="Например: Продукты в супермаркете"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)]"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
