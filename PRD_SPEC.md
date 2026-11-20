# PRD & Technical Specification — Веб-приложение `salary`

- **Название проекта:** `salary`
- **Тип:** Веб-приложение для учёта личных финансов (доходы и расходы)
- **Стек:** Next.js (App Router, TypeScript), Turso (libSQL), Drizzle ORM, Better Auth, Tailwind CSS
- **Дизайн-система:** определяется в файле [design.md](./design.md) (будет заполнена на основе данных от пользователя)
- **Версия документа:** 1.0 (MVP)

---

## 1. Обзор продукта (Product Overview)

### 1.1. Цель
Создать быстрое, удобное и безопасное веб-приложение для ведения учёта личных доходов и расходов с разбивкой по категориям, авторизацией пользователей и наглядной аналитикой баланса за выбранный период.

### 1.2. Целевая аудитория
Пользователи, желающие контролировать личный или семейный бюджет, отслеживать источники дохода, структуру трат по категориям и ежемесячный остаток.

### 1.3. Ключевые сценарии использования (User Stories)
1. Как новый пользователь, я могу зарегистрироваться по email и паролю, чтобы получить личное пространство для учёта финансов с готовым набором базовых категорий.
2. Как авторизованный пользователь, я могу добавлять доходы и расходы с указанием суммы, категории, даты и комментария.
3. Как пользователь, я могу создавать, редактировать и архивировать собственные категории отдельно для доходов и отдельно для расходов.
4. Как пользователь, я могу фильтровать историю операций по периоду, типу (доход/расход), категории и поисковому запросу.
5. Как пользователь, я вижу на дашборде итоговые доходы, расходы, чистый баланс за период и распределение сумм по категориям.

---

## 2. Функциональные требования (PRD)

### 2.1. Авторизация и аккаунт (Auth)
- **Регистрация:** email + пароль + имя пользователя. Проверка уникальности email, валидация сложности пароля (минимум 8 символов).
- **Вход / Выход:** авторизация по email и паролю, безопасная HTTP-only cookie-сессия, выход из аккаунта.
- **Защита маршрутов:** неавторизованные пользователи при попытке открыть `/dashboard`, `/transactions`, `/categories`, `/settings` перенаправляются на `/login`.
- **Изоляция данных:** каждый пользователь имеет доступ строго к своим транзакциям и категориям.
- **Стартовая инициализация:** при регистрации новому пользователю автоматически создаётся набор предустановленных категорий доходов и расходов.
- **Опционально (расширение):** OAuth-вход (Google / GitHub) и восстановление пароля через email.

### 2.2. Категории доходов и расходов (Categories)
- Каждая категория имеет строгий тип:
  - `income` — категория доходов;
  - `expense` — категория расходов.
- **Поля категории:** название, тип (`income` / `expense`), цвет (HEX / токен из `design.md`), иконка (ключ иконки), флаг архивации (`is_archived`).
- **Стартовый набор при регистрации:**
  - *Доходы (`income`):* Зарплата, Фриланс / Подработка, Инвестиции, Подарки, Прочие доходы.
  - *Расходы (`expense`):* Продукты, Жильё и коммуналка, Транспорт, Кафе и рестораны, Здоровье, Развлечения, Подписки, Одежда, Прочие расходы.
- **Операции (CRUD):**
  - Просмотр списка категорий с разделением на «Доходы» и «Расходы».
  - Создание новой категории (уникальное имя в рамках `(user_id, type)`).
  - Редактирование названия, цвета и иконки.
  - Удаление / архивация:
    - Если по категории **нет** транзакций — допускается физическое удаление.
    - Если по категории **есть** транзакции — выполняется архивация (`is_archived = true`), чтобы не нарушать историческую аналитику. Архивная категория скрывается из выбора при создании новых операций, но остаётся видимой в старых записях и фильтрах.

### 2.3. Транзакции — доходы и расходы (Transactions)
- **Поля транзакции:**
  - Тип: `income` (доход) или `expense` (расход).
  - Сумма: положительное число (> 0), хранится в минимальных денежных единицах (`INTEGER`, например, копейки/центы) для исключения ошибок округления с плавающей точкой.
  - Категория: обязательная связь с категорией пользователя, причём `category.type === transaction.type`.
  - Дата операции: дата совершения (`YYYY-MM-DD`, по умолчанию — сегодня).
  - Описание / комментарий: необязательная строка (до 255 символов).
- **Операции:**
  - Создание транзакции (быстрая форма на дашборде и на странице транзакций).
  - Редактирование транзакции (при смене типа `income <-> expense` список категорий обновляется и текущая категория сбрасывается).
  - Удаление транзакции с подтверждением.
- **Список и фильтрация:**
  - Фильтр по периоду (текущий месяц, прошлый месяц, произвольный диапазон дат).
  - Фильтр по типу (все / доходы / расходы).
  - Фильтр по одной или нескольким категориям.
  - Поиск по описанию.
  - Сортировка (по дате по умолчанию — новые сверху; опционально по сумме).
  - Пагинация (например, по 20–30 записей на страницу).

### 2.4. Дашборд и аналитика (Dashboard)
- Выбор отчётного периода (по умолчанию — текущий календарный месяц; переключение по месяцам и выбор произвольного диапазона).
- **Сводные KPI-карточки:**
  - Доходы за период;
  - Расходы за период;
  - Баланс за период (`Доходы − Расходы`);
  - Общий накопленный баланс (за всё время).
- **Визуализация:**
  - Диаграмма распределения расходов по категориям (доли в % и суммы).
  - Диаграмма распределения доходов по категориям (переключатель или отдельный блок).
  - График динамики доходов и расходов (по дням внутри месяца или по месяцам за год).
- **Быстрые блоки:**
  - Последние 5–10 транзакций со ссылкой «Смотреть все».
  - Кнопка быстрого добавления операции.

### 2.5. Настройки профиля (Settings)
- Изменение имени пользователя.
- Выбор основной валюты отображения (например: `RUB`, `USD`, `EUR`, `KZT` и т.д.; хранится в профиле пользователя).
- Смена пароля / выход из всех сессий.

### 2.6. Вне рамок MVP (Post-MVP Roadmap)
- Бюджеты и ежемесячные лимиты по категориям с уведомлениями.
- Регулярные (повторяющиеся) доходы и расходы.
- Мультивалютные счета с автоматической конвертацией курсов.
- Экспорт/импорт транзакций в CSV/Excel.
- Совместный семейный доступ.

---

## 3. Техническая спецификация (SPEC)

### 3.1. Архитектура и технологический стек
| Слой | Технология | Обоснование |
|---|---|---|
| Framework | **Next.js (App Router, TypeScript)** | Единая кодовая база, RSC для быстрой загрузки данных, Server Actions для мутаций |
| База данных | **Turso (libSQL / SQLite)** | Низкие задержки, serverless-совместимость, простой локальный режим разработки |
| DB Client & ORM | **`@libsql/client` + Drizzle ORM** | Типобезопасные SQL-запросы, нативная поддержка Turso/libSQL, лёгкие миграции (`drizzle-kit`) |
| Авторизация | **Better Auth** | Готовый адаптер Drizzle/SQLite, безопасные сессии, Email/Password + простой рост до OAuth |
| Валидация | **Zod** | Единые схемы валидации для клиента и сервера |
| Стилизация и UI | **Tailwind CSS** + компоненты по `design.md` | Гибкость и точное соответствие кастомному дизайну |
| Графики | **Recharts** (или аналог по `design.md`) | Декларативные адаптивные графики для React |

### 3.2. Схема базы данных (Turso / SQLite)

> **Важно по суммам:** Все денежные значения хранятся в целочисленном поле `amount_minor` (копейки/центы, `100.50` = `10050`). Это исключает ошибки float-арифметики в SQLite и JS.

#### Таблицы авторизации (Better Auth)
- `users`:
  - `id` `TEXT PRIMARY KEY`
  - `name` `TEXT NOT NULL`
  - `email` `TEXT NOT NULL UNIQUE`
  - `email_verified` `INTEGER NOT NULL DEFAULT 0`
  - `image` `TEXT`
  - `currency` `TEXT NOT NULL DEFAULT 'RUB'` *(дополнительное поле пользователя)*
  - `created_at` `INTEGER NOT NULL`
  - `updated_at` `INTEGER NOT NULL`
- `sessions`:
  - `id` `TEXT PRIMARY KEY`
  - `user_id` `TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`
  - `token` `TEXT NOT NULL UNIQUE`
  - `expires_at` `INTEGER NOT NULL`
  - `ip_address` `TEXT`
  - `user_agent` `TEXT`
  - `created_at` `INTEGER NOT NULL`
  - `updated_at` `INTEGER NOT NULL`
- `accounts`: стандартная таблица провайдеров/паролей Better Auth (`user_id` FK -> `users.id` ON DELETE CASCADE).
- `verifications`: стандартная таблица токенов подтверждения Better Auth.

#### Доменные таблицы приложения

**`categories`**
| Колонка | Тип (SQLite) | Ограничения | Описание |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | UUID / nanoid |
| `user_id` | `TEXT` | `NOT NULL`, FK -> `users(id)` `ON DELETE CASCADE` | Владелец категории |
| `name` | `TEXT` | `NOT NULL` | Название категории (1..50 символов) |
| `type` | `TEXT` | `NOT NULL`, `CHECK (type IN ('income', 'expense'))` | Тип категории |
| `color` | `TEXT` | `NOT NULL` | Цвет (HEX или токен) |
| `icon` | `TEXT` | `NOT NULL` | Идентификатор иконки |
| `is_archived` | `INTEGER` | `NOT NULL DEFAULT 0` | `0` — активна, `1` — в архиве |
| `created_at` | `INTEGER` | `NOT NULL` | Unix timestamp (ms) |
| `updated_at` | `INTEGER` | `NOT NULL` | Unix timestamp (ms) |

*Индексы для `categories`:*
- `UNIQUE INDEX categories_user_type_name_uidx ON categories(user_id, type, lower(name))`
- `INDEX categories_user_type_idx ON categories(user_id, type, is_archived)`

**`transactions`**
| Колонка | Тип (SQLite) | Ограничения | Описание |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | UUID / nanoid |
| `user_id` | `TEXT` | `NOT NULL`, FK -> `users(id)` `ON DELETE CASCADE` | Владелец транзакции |
| `category_id` | `TEXT` | `NOT NULL`, FK -> `categories(id)` `ON DELETE RESTRICT` | Ссылка на категорию |
| `type` | `TEXT` | `NOT NULL`, `CHECK (type IN ('income', 'expense'))` | Тип операции |
| `amount_minor` | `INTEGER` | `NOT NULL`, `CHECK (amount_minor > 0)` | Сумма в минимальных единицах |
| `description` | `TEXT` | `NOT NULL DEFAULT ''` | Комментарий / заметка |
| `occurred_at` | `TEXT` | `NOT NULL` | Дата операции в формате `YYYY-MM-DD` (удобно для группировки без сдвига таймзон) |
| `created_at` | `INTEGER` | `NOT NULL` | Unix timestamp (ms) |
| `updated_at` | `INTEGER` | `NOT NULL` | Unix timestamp (ms) |

*Индексы для `transactions`:*
- `INDEX transactions_user_date_idx ON transactions(user_id, occurred_at DESC, created_at DESC)`
- `INDEX transactions_user_type_date_idx ON transactions(user_id, type, occurred_at)`
- `INDEX transactions_user_category_idx ON transactions(user_id, category_id)`

> **Примечание по внешним ключам в SQLite/Turso:** На уровне бизнес-логики дополнительно проверяется, что `category.user_id === session.user.id` и `category.type === input.type`.

### 3.3. Структура проекта (Next.js App Router)

```text
salary/
├── PRD_SPEC.md
├── IMPLEMENTATION_PLAN.md
├── design.md
├── drizzle.config.ts
├── next.config.ts
├── .env.example
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx          # Защищённый shell (Sidebar/Nav + проверка сессии)
    │   │   ├── dashboard/page.tsx  # Аналитика, KPI, графики, последние операции
    │   │   ├── transactions/page.tsx # Реестр доходов/расходов + фильтры + CRUD
    │   │   ├── categories/page.tsx   # Управление категориями доходов/расходов
    │   │   └── settings/page.tsx     # Профиль и валюта
    │   ├── api/
    │   │   └── auth/[...all]/route.ts # Обработчик Better Auth
    │   ├── layout.tsx
    │   ├── page.tsx                # Редирект: авторизован -> /dashboard, иначе -> /login
    │   └── globals.css
    ├── components/
    │   ├── ui/                     # Базовые UI-компоненты согласно design.md
    │   ├── layout/                 # Навигация, шапка, мобильное меню
    │   ├── dashboard/              # KPI-карточки, графики, выбор периода
    │   ├── transactions/           # Таблица, фильтры, модалка/форма транзакции
    │   └── categories/             # Карточки категорий, форма создания/редактирования
    ├── db/
    │   ├── index.ts                # Подключение @libsql/client + Drizzle
    │   ├── schema.ts               # Таблицы auth + categories + transactions
    │   └── seed-defaults.ts        # Стартовые категории для нового пользователя
    ├── lib/
    │   ├── auth.ts                 # Конфигурация Better Auth (server)
    │   ├── auth-client.ts          # Клиент Better Auth (browser)
    │   ├── money.ts                # Форматирование и конвертация major <-> minor
    │   └── validators/             # Zod-схемы (auth, categories, transactions)
    └── actions/
        ├── categories.ts           # Server Actions CRUD категорий
        ├── transactions.ts         # Server Actions CRUD транзакций
        └── settings.ts             # Server Actions профиля
```

### 3.4. Контракт операций (Server Actions & Queries)

Все Server Actions и серверные загрузчики данных:
1. Извлекают текущую сессию через `auth.api.getSession({ headers })`. При отсутствии сессии возвращают ошибку `UNAUTHORIZED` или редирект на `/login`.
2. Валидируют входные данные через Zod.
3. Всегда фильтруют SQL-запросы по `user_id = session.user.id`.
4. После мутаций вызывают `revalidatePath` для обновления кэша Next.js.

**Основные операции:**
- **Категории:**
  - `getCategories({ type?, includeArchived? })`
  - `createCategory({ name, type, color, icon })`
  - `updateCategory({ id, name, color, icon })`
  - `deleteOrArchiveCategory({ id })`
  - `restoreCategory({ id })`
- **Транзакции:**
  - `getTransactions({ from?, to?, type?, categoryId?, search?, page?, pageSize? })`
  - `createTransaction({ type, amountMajor, categoryId, occurredAt, description })`
  - `updateTransaction({ id, type, amountMajor, categoryId, occurredAt, description })`
  - `deleteTransaction({ id })`
- **Аналитика (Dashboard Queries):**
  - `getPeriodSummary({ from, to })` -> `{ totalIncomeMinor, totalExpenseMinor, periodBalanceMinor, allTimeBalanceMinor }`
  - `getBreakdownByCategory({ from, to, type })` -> `Array<{ categoryId, name, color, icon, totalMinor, percentage }>`
  - `getCashflowSeries({ from, to, granularity })` -> `Array<{ date, incomeMinor, expenseMinor }>`

### 3.5. Переменные окружения (`.env.example`)

```env
# Turso / libSQL
TURSO_DATABASE_URL="file:./local.db" # В проде: libsql://<db-name>-<org>.turso.io
TURSO_AUTH_TOKEN=""                  # Обязателен для облачного Turso

# Better Auth
BETTER_AUTH_SECRET="replace-with-32+-char-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3.6. Безопасность и нефункциональные требования (NFR)
- **Безопасность:**
  - Пароли хешируются встроенным алгоритмом Better Auth (`scrypt`).
  - Cookies сессий: `HttpOnly`, `SameSite=Lax`, `Secure` в production.
  - Защита от IDOR: любая операция по `id` транзакции или категории проверяет `AND user_id = currentUserId`.
  - Валидация сумм: запрещены `NaN`, `Infinity`, отрицательные и нулевые значения, переполнение безопасного целого.
- **Производительность:**
  - Агрегация сумм выполняется на стороне SQLite/Turso (`SUM`, `GROUP BY`), а не загрузкой всех строк в память.
  - Композитные индексы на `(user_id, occurred_at)` и `(user_id, category_id)`.
- **Адаптивность и UX:**
  - Полная поддержка Desktop и Mobile экранов (точные брейкпоинты и макеты фиксируются в `design.md`).
  - Оптимистичный или мгновенно отзывчивый UI с понятными состояниями загрузки (skeletons), пустыми состояниями (empty states) и уведомлениями об ошибках/успехе.

---

## 4. Критерии приёмки MVP (Acceptance Criteria)
1. Пользователь может зарегистрироваться, войти и выйти из системы; гость не может открыть внутренние страницы или вызвать Server Actions.
2. После регистрации в аккаунте автоматически доступны базовые категории доходов и расходов.
3. Пользователь может создать, отредактировать, архивировать и удалить (если нет операций) свою категорию.
4. Пользователь может создать, отредактировать и удалить доход или расход; невозможно привязать расход к категории дохода и наоборот.
5. Фильтры транзакций (период, тип, категория, поиск) корректно сужают выборку.
6. Дашборд отображает точные суммы доходов, расходов, баланса (без ошибок округления) и графики по категориям и динамике.
7. Два разных пользователя полностью изолированы друг от друга.
8. Все данные сохраняются в Turso (локальный SQLite для dev и Turso Cloud для prod).
9. Визуальное оформление соответствует спецификации из [design.md](./design.md).
