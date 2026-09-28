# Frontend Template

Стартовый шаблон фронтенда на [Next.js](https://nextjs.org) (App Router) с готовой авторизацией,
дашборд-разметкой на [shadcn/ui](https://ui.shadcn.com) и таблицами/графиками. Используется как
база для новых проектов.

## Стек

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI) — компоненты в `components/ui`
- **axios** — HTTP-клиент с автоматическим редиректом на `/login` при 401
- **zod** — валидация форм и переменных окружения
- **@tanstack/react-table**, **recharts**, **@dnd-kit** — таблицы, графики, drag-and-drop
- Middleware, защищающий приватные роуты по наличию cookie `access_token`

## Быстрый старт

### 1. Переменные окружения

```bash
cp .env.example .env.local
```

| Переменная             | Описание                                  |
| ----------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | URL бэкенда (например, `http://localhost:3001`) |

Переменные валидируются в `lib/env.ts` — при отсутствии обязательных значений приложение
упадёт с понятной ошибкой вместо тихого `undefined`.

### 2. Установка и запуск (локально)

```bash
pnpm install
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### 3. Запуск через Docker

```bash
docker compose up --build
```

## Скрипты

| Команда        | Назначение                          |
| -------------- | ------------------------------------- |
| `pnpm dev`     | Запуск дев-сервера                    |
| `pnpm build`   | Продакшн-сборка                       |
| `pnpm start`   | Запуск собранного приложения          |
| `pnpm lint`    | ESLint                                |
| `pnpm format`  | Форматирование Prettier               |
| `pnpm test`    | Тесты (Vitest + Testing Library)      |
| `pnpm test:watch` | Тесты в watch-режиме               |

## Структура проекта

```
app/            # роуты App Router (login, signup, forgot/reset-password, дашборд)
  error.tsx     # общая страница ошибки рендера
  not-found.tsx # страница 404
  loading.tsx   # состояние загрузки
components/     # переиспользуемые компоненты, components/ui — примитивы shadcn
hooks/          # кастомные React-хуки
lib/            # axios-клиент (api.ts), валидация env (env.ts), утилиты
shared/         # константы/типы, общие для нескольких модулей
middleware.ts   # защита приватных роутов по cookie access_token
```

## Аутентификация

Бэкенд выставляет JWT в httpOnly-cookie `access_token`. `middleware.ts` проверяет её наличие
для маршрутизации (пускает на публичные страницы `/login`, `/signup`, `/forgot-password`,
`/reset-password` без токена и наоборот). Сама валидность токена проверяется на бэкенде;
`lib/api.ts` перехватывает 401-ответы и редиректит на `/login`.

## CI/CD

В `.github/workflows/ci.yml` настроен пайплайн: установка зависимостей → lint → test → build,
запускается на push/PR в `main`.

## Лицензия

Приватный шаблон, см. [LICENSE](./LICENSE).
