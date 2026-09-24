# Rent Ride Roll LLC

Mobile-first rental website and lightweight fleet operations system for Rent Ride Roll LLC.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/rent-ride-n-roll` — public site and mobile admin frontend
- `artifacts/api-server/src/routes/fleet.ts` — fleet operations API
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema/fleet.ts` — normalized fleet database schema

## Architecture decisions

- Rental and maintenance conflicts are blocked by the API before records are created or extended.
- Due-today and overdue states are computed from expected return timestamps in the Raleigh-Durham timezone.
- Public vehicle responses exclude plates, VINs, unit numbers, and operational notes.

## Product

Public fleet, rates, requirements, service area, company, and contact pages plus mobile admin views for today's work, calendar, vehicles, customers, rentals, and maintenance.
The canonical business name is **Rent Ride Roll LLC** (Roll has two Ls). Use it in all customer and admin copy, metadata, and accessibility labels; do not shorten it to “Rol.” Preserve the supplied logo artwork.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Private API access is restricted to the approved administrator email after Supabase token validation.
- Do not invent a business phone number, address, hours, reviews, ratings, or testimonials.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
