# System Architecture

## Application Architecture
The system is a full-stack web application built on **Next.js 16.2.6 (App Router)**. It uses a server-centric approach where API routes and Server Actions handle initial data fetching and mutations, while Client Components are used strictly for interactive UI elements.

## Folder Responsibilities
- `app/`: Next.js App Router definitions. Pages are grouped by roles (`/athlete`, `/club`, `/staff`, `/admin`, `/team-official`). Contains UI pages and API routes (`app/api/`).
- `components/`: Shared React components used across different pages (e.g., UI elements in `components/shared/`).
- `lib/`: Core backend and shared utilities. Includes authentication (`auth.ts`), business logic services (e.g., `roster-service.ts`, `account-service.ts`, `analytics.ts`), validation logic, and database clients.
- `prisma/`: Database schema (`schema.prisma`) and migrations.
- `public/`: Static assets.
- `tests/`: Unit and integration tests (`tests/unit/`, `tests/integration/`).

## Frontend Architecture
- **Framework**: React 19 under Next.js App Router.
- **Styling**: Tailwind CSS 4 (`app/globals.css`).
- **State Management**: React hooks (e.g., `useState`, `useTransition`) and Next.js server state.
- **Data Fetching**: Primarily Server Components, passing data down as props. Client-side fetch is used for specific API interactions via `lib/http-client.ts`.

## Backend Architecture
- **API Engine**: Next.js API Routes (`app/api/**/route.ts`).
- **Business Logic**: Extracted into reusable service modules in `lib/`. API routes should remain thin and delegate complex logic to these services.
- **Storage**: Supabase Storage for storing files/documents. New document flows use private buckets (e.g., `athlete-private`) with signed URLs and strict owner checks.

## Database Architecture
- **Database**: PostgreSQL.
- **ORM**: Prisma Client v7 (`@prisma/adapter-pg`).
- **Data Access Rules**: All database interactions must go through Prisma. Prisma Schema is the single source of truth for the data model. Avoid raw SQL queries unless absolutely necessary for performance/complex transactions. Use `Serializable` transaction isolation for critical concurrency operations (like roster submission).

## Authentication & Authorization (RBAC)
- **Authentication**: JWT-based (stored in `httpOnly` cookies). Passwords hashed via `bcryptjs`.
- **Authorization**: Role-Based Access Control (RBAC) via the `Role` enum (e.g., `ATHLETE`, `CLUB`, `STAFF`, `ADMIN`, `SUPERADMIN`, `TEAM_OFFICIAL`).
- **Enforcement**: Server-side verification is mandatory. `proxy.ts` acts as a middleware guard on Node.js runtime, but API routes and Server Actions **must** independently verify the user's session, role, and resource ownership (via `lib/auth.ts:getSession`). Never trust client-side claims like the `role` cookie.

## Validation & Error Handling
- **Validation**: Server-side input validation is required before processing any database mutations (using logic in `lib/validation.ts` or similar).
- **Error Handling**: API routes return standard HTTP status codes (400 for bad request, 401/403 for auth errors, 404 for not found, 409 for conflicts). Business services throw specific errors caught by API handlers.
