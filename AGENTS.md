# Operating Instructions for Codex

## 1. Project Overview
ระบบบริหารจัดการการแข่งขันกีฬา (University Sports Competition Management System) สำหรับมหาวิทยาลัยพะเยา

## 2. Tech Stack
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript 5
- Tailwind CSS 4
- Prisma 7 ORM
- PostgreSQL (via `@prisma/adapter-pg`)
- Supabase Storage

## 3. Core Rules for Implementation

### Coding Rules
- Inspect existing code before modifying. Do not modify unrelated files.
- Use TypeScript strict typing. Avoid using `any`.
- Reuse existing components, services, and utilities. Avoid duplicated business logic.
- Avoid introducing unnecessary dependencies (check `package.json`).
- Indentation: 2 spaces. Double quotes. Semicolons.

### Architecture Rules
- Follow existing architecture patterns (e.g., UI components in `components/`, business logic in `lib/`, API in `app/api/`).
- Do not invent new architectural patterns if an existing one fits.

### Database Rules
- Access PostgreSQL exclusively through Prisma.
- `prisma/schema.prisma` is the source of truth for the database schema.
- Do not run `db:push` or schema migrations unless explicitly instructed.

### Validation Rules
- Validate all user input on the server-side.

### Security / Authorization Rules
- Verify authorization and roles server-side in all API routes.
- Do not trust client-side data (e.g., cookies like `role`) for authorization.
- Never commit `.env` or expose secrets in client components.

## 4. Pre-Implementation Checklist
- Read `docs/NEXT_TASK.md` to understand the current task.
- Locate and inspect relevant files in the repository.
- Verify the existence of scripts in `package.json` before running them.

## 5. Post-Implementation Checklist
- Run type checking: `npx tsc --noEmit`
- Run linting: `npm run lint`
- Build the project: `npm run build`
- Run unit tests if applicable: `npm run test:unit`
- Fix any issues, errors, or warnings caused by your changes.
- Update `docs/HANDOFF.md` when the task is fully completed.
