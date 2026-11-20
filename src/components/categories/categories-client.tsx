"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createCategoryAction,
  deleteOrArchiveCategoryAction,
  restoreCategoryAction,
  updateCategoryAction,
} from "@/actions/categories";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Modal } from "@/components/ui/modal";
import type { CategoryWithStats } from "@/db/queries/categories";
import type { TransactionType } from "@/db/schema";
import { cn } from "@/lib/cn";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/icons";

export function CategoriesClient({
  categories,
}: {
  categories: CategoryWithStats[];
}) {
  const [activeTab, setActiveTab] = useState<TransactionType>("expense");
  const [showArchived, setShowArchived] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryWithStats | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0].key);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () =>
      categories.filter(
        (c) => c.type === activeTab && (showArchived || !c.isArchived)
      ),
    [categories, activeTab, showArchived]
  );

  const archivedCount = useMemo(
    () =>
      categories.filter((c) => c.type === activeTab && c.isArchived).length,
    [categories, activeTab]
  );

  function openCreate() {
    setEditing(null);
    setName("");
    setColor(activeTab === "income" ? "#10b981" : "#ef4444");
    setIcon(activeTab === "income" ? "briefcase" : "shopping-cart");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(cat: CategoryWithStats) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setError(null);
    setModalOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const res = editing
        ? await updateCategoryAction({
            id: editing.id,
            name,
            color,
            icon,
          })
        : await createCategoryAction({
            name,
            type: activeTab,
            color,
            icon,
          });

      if (!res.ok) {
        setError(res.error ?? "Не удалось сохранить категорию");
        return;
      }

      setModalOpen(false);
      setEditing(null);
    });
  }

  function handleDeleteOrArchive(cat: CategoryWithStats) {
    const msg =
      cat.transactionCount > 0
        ? `У категории «${cat.name}» есть операции (${cat.transactionCount}). Она будет перенесена в архив, чтобы сохранить историю. Продолжить?`
        : `Удалить категорию «${cat.name}»?`;

    if (!confirm(msg)) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteOrArchiveCategoryAction(cat.id);
      if (res.ok && res.data?.mode === "archived") {
        setFeedback(`Категория «${cat.name}» перенесена в архив.`);
      }
    });
  }

  function handleRestore(cat: CategoryWithStats) {
    setFeedback(null);
    startTransition(async () => {
      await restoreCategoryAction(cat.id);
      setFeedback(`Категория «${cat.name}» восстановлена.`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Категории</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Управляйте категориями отдельно для расходов и доходов
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)]"
        >
          <Plus className="h-4 w-4" />
          Новая категория
        </button>
      </div>

      {/* Tabs & Archive Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("expense")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              activeTab === "expense"
                ? "bg-red-50 text-[var(--expense)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Расходы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              activeTab === "income"
                ? "bg-emerald-50 text-[var(--income)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            Доходы
          </button>
        </div>

        {archivedCount > 0 && (
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-default)] accent-[var(--accent-primary)]"
            />
            Показать архивные ({archivedCount})
          </label>
        )}
      </div>

      {feedback && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
          {feedback}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-2xs transition",
              cat.isArchived && "opacity-65"
            )}
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-2xs"
                style={{ backgroundColor: cat.color }}
              >
                <CategoryIcon name={cat.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{cat.name}</p>
                  {cat.isArchived && (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Архив
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  Операций: {cat.transactionCount}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {cat.isArchived ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRestore(cat)}
                  className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-emerald-50 hover:text-[var(--income)]"
                  title="Восстановить из архива"
                >
                  <ArchiveRestore className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
                    title="Редактировать"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDeleteOrArchive(cat)}
                    className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-red-50 hover:text-[var(--danger)]"
                    title={
                      cat.transactionCount > 0 ? "В архив" : "Удалить категорию"
                    }
                  >
                    {cat.transactionCount > 0 ? (
                      <Archive className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={
          editing
            ? "Редактировать категорию"
            : activeTab === "income"
              ? "Новая категория дохода"
              : "Новая категория расхода"
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Название</label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Спортзал"
              className="w-full rounded-xl border border-[var(--border-default)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Цвет</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={cn(
                    "h-8 w-8 rounded-full transition",
                    color === swatch
                      ? "scale-110 ring-2 ring-slate-900 ring-offset-2"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch }}
                  aria-label={swatch}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Иконка</label>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setIcon(item.key)}
                  title={item.label}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-xl border transition",
                    icon === item.key
                      ? "border-[var(--accent-primary)] bg-indigo-50 text-[var(--accent-primary)]"
                      : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
                  )}
                >
                  <CategoryIcon name={item.key} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)]"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
