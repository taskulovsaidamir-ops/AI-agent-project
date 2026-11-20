"use client";

import { useState, useTransition } from "react";
import { Check, Database, Loader2 } from "lucide-react";
import { updateProfileSettingsAction } from "@/actions/settings";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import type { CurrentUser } from "@/lib/session";

export function SettingsClient({
  user,
  isRemoteTurso,
}: {
  user: CurrentUser;
  isRemoteTurso: boolean;
}) {
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.currency);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const res = await updateProfileSettingsAction({ name, currency });
      if (!res.ok) {
        setError(res.error ?? "Не удалось сохранить настройки");
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Профиль, валюта отображения и статус базы данных
        </p>
      </div>

      {/* Profile Settings */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-2xs"
      >
        <h2 className="text-base font-semibold">Профиль и валюта</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-muted)] px-3.5 py-2.5 text-sm text-[var(--text-secondary)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Имя</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Основная валюта
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          >
            {SUPPORTED_CURRENCIES.map((cur) => (
              <option key={cur.code} value={cur.code}>
                {cur.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            Настройки сохранены
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить изменения
        </button>
      </form>

      {/* Database Connection Info */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-2xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[var(--accent-primary)]">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">База данных (Turso / libSQL)</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Текущий режим:{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {isRemoteTurso
                  ? "Turso Cloud (подключено через .env)"
                  : "Локальный SQLite (file:./local.db)"}
              </span>
            </p>
            {!isRemoteTurso && (
              <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                Чтобы переключиться на облачный Turso, впишите{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  TURSO_DATABASE_URL
                </code>{" "}
                и{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">
                  TURSO_AUTH_TOKEN
                </code>{" "}
                в файл <code className="rounded bg-slate-100 px-1 py-0.5">.env</code> и выполните{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5">npm run db:push</code>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
