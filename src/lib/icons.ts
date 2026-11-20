export const CATEGORY_COLORS = [
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#14b8a6",
  "#0ea5e9",
  "#84cc16",
  "#64748b",
] as const;

export const CATEGORY_ICONS = [
  { key: "briefcase", label: "Работа" },
  { key: "laptop", label: "Фриланс" },
  { key: "trending-up", label: "Инвестиции" },
  { key: "gift", label: "Подарки" },
  { key: "plus-circle", label: "Доход" },
  { key: "shopping-cart", label: "Продукты" },
  { key: "home", label: "Жильё" },
  { key: "car", label: "Транспорт" },
  { key: "utensils", label: "Еда / Кафе" },
  { key: "heart-pulse", label: "Здоровье" },
  { key: "gamepad-2", label: "Развлечения" },
  { key: "repeat", label: "Подписки" },
  { key: "shirt", label: "Одежда" },
  { key: "graduation-cap", label: "Обучение" },
  { key: "plane", label: "Путешествия" },
  { key: "smartphone", label: "Связь / Техника" },
  { key: "piggy-bank", label: "Накопления" },
  { key: "tag", label: "Прочее" },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICONS)[number]["key"];
