import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { categories, type TransactionType } from "./schema";

interface DefaultCategorySeed {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  // Доходы
  { name: "Зарплата", type: "income", color: "#10b981", icon: "briefcase" },
  { name: "Фриланс", type: "income", color: "#06b6d4", icon: "laptop" },
  { name: "Инвестиции", type: "income", color: "#6366f1", icon: "trending-up" },
  { name: "Подарки", type: "income", color: "#f59e0b", icon: "gift" },
  { name: "Прочие доходы", type: "income", color: "#64748b", icon: "plus-circle" },

  // Расходы
  { name: "Продукты", type: "expense", color: "#ef4444", icon: "shopping-cart" },
  { name: "Жильё и коммуналка", type: "expense", color: "#f97316", icon: "home" },
  { name: "Транспорт", type: "expense", color: "#3b82f6", icon: "car" },
  { name: "Кафе и рестораны", type: "expense", color: "#ec4899", icon: "utensils" },
  { name: "Здоровье", type: "expense", color: "#14b8a6", icon: "heart-pulse" },
  { name: "Развлечения", type: "expense", color: "#8b5cf6", icon: "gamepad-2" },
  { name: "Подписки", type: "expense", color: "#0ea5e9", icon: "repeat" },
  { name: "Одежда", type: "expense", color: "#d946ef", icon: "shirt" },
  { name: "Прочие расходы", type: "expense", color: "#64748b", icon: "tag" },
];

export async function seedDefaultCategories(userId: string): Promise<void> {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const now = new Date();
  await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((item) => ({
        id: randomUUID(),
        userId,
        name: item.name,
        type: item.type,
        color: item.color,
        icon: item.icon,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing();
}
