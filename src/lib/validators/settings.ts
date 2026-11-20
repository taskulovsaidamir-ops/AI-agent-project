import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/money";

const currencyCodes = SUPPORTED_CURRENCIES.map((c) => c.code) as [
  string,
  ...string[],
];

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(60, "Имя слишком длинное"),
  currency: z.enum(currencyCodes),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
