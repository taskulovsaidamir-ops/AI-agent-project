# salary — Веб-приложение учёта доходов и расходов

Личный финансовый трекер на **Next.js (App Router, TypeScript)** и **Turso (libSQL)** с авторизацией, категориями доходов/расходов, фильтрацией транзакций и аналитикой баланса.

## Стек
- **Next.js 15** (App Router, Server Actions, TypeScript)
- **Turso (libSQL)** + **Drizzle ORM** (`@libsql/client`)
- **Better Auth** (Email + Password, HTTP-only сессии)
- **Tailwind CSS v4** + **Recharts** + **Lucide Icons** + **Zod**

## Быстрый старт локально

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Настройте `.env` на основе `.env.example`:
   - Для локальной разработки без облака оставьте `TURSO_DATABASE_URL=""` — автоматически будет использован локальный SQLite-файл `file:./local.db`.
   - Для подключения облачной базы **Turso** вставьте `TURSO_DATABASE_URL` (`libsql://...`) и `TURSO_AUTH_TOKEN`.

3. Примените схему базы данных:
   ```bash
   npm run db:push
   ```

4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```
   Откройте [http://localhost:3000](http://localhost:3000).

## Публикация на GitHub и деплой
- Файл `.env` добавлен в `.gitignore` и **не попадает** в репозиторий.
- На хостинге (например, Vercel) задайте переменные `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`.

## Документация проекта
- [PRD_SPEC.md](./PRD_SPEC.md) — требования и техническая спецификация
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — пошаговый план реализации
- [design.md](./design.md) — дизайн-система и визуальные токены
