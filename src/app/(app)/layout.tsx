import { AppShell } from "@/components/layout/app-shell";
import { seedDefaultCategories } from "@/db/seed-defaults";
import { requireUser } from "@/lib/session";

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // Ensure user always has starter categories even on first login
  await seedDefaultCategories(user.id);

  return <AppShell user={user}>{children}</AppShell>;
}
