import { z } from "zod";

export const categoryTypeSchema = z.enum(["income", "expense"]);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Введите название категории")
    .max(50, "Название не должно превышать 50 символов"),
  type: categoryTypeSchema,
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  icon: z.string().trim().min(1).max(40),
});

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "Введите название категории")
    .max(50, "Название не должно превышать 50 символов"),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Некорректный цвет"),
  icon: z.string().trim().min(1).max(40),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
