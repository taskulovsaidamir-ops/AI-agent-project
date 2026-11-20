import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDefaultCategories } from "@/db/seed-defaults";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      currency: {
        type: "string",
        required: false,
        defaultValue: "RUB",
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            await seedDefaultCategories(createdUser.id);
          } catch (err) {
            console.error("Failed to seed default categories:", err);
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});
