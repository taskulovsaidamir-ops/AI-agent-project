import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-canvas)] px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-primary)] text-white shadow-md shadow-indigo-500/20">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            salary
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Учёт доходов и расходов
          </p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
