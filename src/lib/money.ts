export const SUPPORTED_CURRENCIES = [
  { code: "RUB", label: "Российский рубль (₽)", symbol: "₽" },
  { code: "USD", label: "Доллар США ($)", symbol: "$" },
  { code: "EUR", label: "Евро (€)", symbol: "€" },
  { code: "KZT", label: "Казахстанский тенге (₸)", symbol: "₸" },
  { code: "BYN", label: "Белорусский рубль (Br)", symbol: "Br" },
  { code: "UAH", label: "Украинская гривна (₴)", symbol: "₴" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function toMinorUnits(amountMajor: number): number {
  if (!Number.isFinite(amountMajor)) {
    throw new Error("Некорректная сумма");
  }
  return Math.round(amountMajor * 100);
}

export function fromMinorUnits(amountMinor: number): number {
  return amountMinor / 100;
}

export function formatMoney(
  amountMinor: number,
  currency: string = "RUB",
  options?: {
    showSign?: boolean;
    type?: "income" | "expense";
    compact?: boolean;
  }
): string {
  const safeCurrency = SUPPORTED_CURRENCIES.some((c) => c.code === currency)
    ? currency
    : "RUB";

  const value = fromMinorUnits(Math.abs(amountMinor));
  const hasFraction = Math.abs(amountMinor) % 100 !== 0;

  const formatted = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
    notation: options?.compact ? "compact" : "standard",
  }).format(value);

  if (options?.type === "income") {
    return `+${formatted}`;
  }
  if (options?.type === "expense") {
    return `−${formatted}`;
  }
  if (options?.showSign) {
    if (amountMinor > 0) return `+${formatted}`;
    if (amountMinor < 0) return `−${formatted}`;
  } else if (amountMinor < 0) {
    return `−${formatted}`;
  }

  return formatted;
}
