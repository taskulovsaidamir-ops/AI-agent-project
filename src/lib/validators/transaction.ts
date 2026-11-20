import { z } from "zod";

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amountMajor: z.coerce
    .number({ invalid_type_error: "Введите корректную сумму" })
    .positive("Сумма должна быть больше 0")
    .max(999_999_999, "Слишком большая сумма"),
  categoryId: z.string().min(1, "Выберите категорию"),
  occurredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Выберите дату в формате ГГГГ-ММ-ДД"),
  description: z
    .string()
    .trim()
    .max(255, "Комментарий не длиннее 255 символов")
    .optional()
    .default(""),
});

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
