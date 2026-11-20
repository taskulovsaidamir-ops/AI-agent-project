"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setError(res.error.message || "Неверный email или пароль");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Не удалось выполнить вход. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Вход в аккаунт
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Введите свои данные, чтобы открыть личный бюджет
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            Пароль
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Войти
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Нет аккаунта?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--accent-primary)] hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
