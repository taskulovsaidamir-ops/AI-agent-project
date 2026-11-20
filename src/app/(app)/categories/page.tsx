import { CategoriesClient } from "@/components/categories/categories-client";
import { getUserCategories } from "@/db/queries/categories";
import { requireUser } from "@/lib/session";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getUserCategories(user.id, {
    includeArchived: true,
  });

  return <CategoriesClient categories={categories} />;
}
