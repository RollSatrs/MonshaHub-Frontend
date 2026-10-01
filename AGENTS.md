# MonshaHub

Система управления общественными банями и банными комплексами. Центр продукта —
реальная работа бани во время посещения клиента (`Visit`), а не бронирование само по себе.

## Repositories

- **Frontend** (this repo): [RollSatrs/MonshaHub-Frontend](https://github.com/RollSatrs/MonshaHub-Frontend)
  Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui + React Query. Types for API
  requests/responses are generated from the backend's OpenAPI contract (`pnpm api:types`) —
  never hand-write a copy of a backend model.
- **Backend**: [RollSatrs/MonshaHub-Backend](https://github.com/RollSatrs/MonshaHub-Backend)
  NestJS 11 + Drizzle ORM + PostgreSQL. Source of truth for all business logic: pricing,
  stock, room state, permissions. The frontend must not recompute any of this itself —
  it displays what the backend returns (e.g. a countdown derived from `endsAt`/`serverTime`,
  not a locally-computed total or room status).

## Active team

- **Роллан** — backend
- **Асанали** — see assigned Issues for current scope

Roles are per-feature, not permanent — check Issue assignments rather than assuming.

## Project state

- Phase 0 (foundation: auth, roles OWNER/CASHIER, organizations) — merged to `main`.
- Phase 1 (rooms, tariffs, products with stock journal, services, staff) — merged to `main`.
- Phase 2 (bookings, visits, live cashier board, payments) — in progress, not yet merged.

## Collaboration

- **GitHub Issues** are the source of truth for tasks. Don't rely on chat history between
  agents — if it matters to someone else's work, it belongs in an Issue or PR comment.
- A **GitHub Project** spanning both repos should be used for overall status once created;
  check for one before creating a duplicate.
- Development happens in feature branches, never directly on `main`.
  Suggested format: `agent/<developer>/<issue-number>-<short-name>`.
- Finished work goes through a **Pull Request** referencing its Issue (`Closes #N`).
- Changes that depend on a backend API contract change must reference the backend Issue/PR
  that introduces it — don't guess at a shape the backend doesn't expose yet.

## Conventions that must not break

See this repo's `CLAUDE.md` for the full design/UI rules enforced by Claude Code. Key
points relevant to any contributor:

- API types come from `pnpm api:types` (reads the backend's `openapi.json` /
  `/api/docs-json`) — don't hand-write request/response interfaces that duplicate them.
- Errors from the backend are `{ statusCode, code, message, details?, meta?, path, timestamp }`;
  branch UI logic on `code` (see `lib/get-error-message.ts`), never on `message` text.
- Money is always a decimal string from the backend (`"10000.00"`); format it for display
  (`lib/money.ts`), never do arithmetic on it in the frontend.
- UI primitives come from shadcn (`npx shadcn@latest add <component>`), customized via
  `className`/`cva`, not hand-rolled from scratch.
- Session is an httpOnly cookie (`lib/auth-cookie.ts`); there is no bearer token in JS.
