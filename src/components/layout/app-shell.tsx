"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Tags,
  Wallet,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import type { CurrentUser } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/transactions", label: "Операции", icon: ArrowLeftRight },
  { href: "/categories", label: "Категории", icon: Tags },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-[var(--border-default)] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-white shadow-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">salary</span>
            <span className="ml-1.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
              finance
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-indigo-50 text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-default)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--bg-surface-muted)] px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-sm font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-[var(--text-secondary)]">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-primary)] disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Выход..." : "Выйти"}
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">salary</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Выйти
        </button>
      </header>

      {/* Main Content */}
      <main className="pb-24 lg:pb-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition",
                active
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
