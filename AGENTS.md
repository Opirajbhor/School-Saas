# AGENTS.md

## 1. Most Important Rules

- **Follow my existing coding patterns.** Check similar files before writing code.
- Follow my TypeScript, Zod, Drizzle schema, Server Action, and TSX patterns.
- Reuse existing functions and components instead of creating duplicates.
- Follow the existing folder structure. Keep code in the correct files; don't put everything in one file.
- Make only the changes required for the task. Don't rewrite unrelated code.
- If something is unclear, inspect the codebase before making assumptions.
- for table use tanstack table as i have used.

## 2. Project Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- Drizzle ORM + PostgreSQL (Neon)
- Better Auth
- Zod v4 + drizzle-zod
- React Hook Form + TanStack Query
- pnpm only

## 3. Code Structure

- `app/` — routes, pages, and feature-specific components/actions.
- `app/dashboard/` — institute admin and teacher features.
- `app/super-admin/` — platform-wide default data management.
- `components/` — shared UI components and forms.
- `src/drizzle-DB/schema/` — database schemas and relations.
- `src/server-actions/` — reusable server logic and CRUD helpers.
- `src/validation/` — shared Zod schemas.
- Feature-specific schemas, actions, tables, and components belong in their existing feature folders.

Use the existing naming conventions and import paths.

## 4. Server Actions

- Check existing actions before creating new ones.
- Reuse CRUD helpers from `src/server-actions/crud-funtions/` whenever possible.
- Use feature-specific actions for feature logic.
- Keep database access on the server.
- Return the existing result format:

  `{ success: true, data }`

  `{ success: false, error, details }`

- Use existing toast, loading, and query invalidation helpers.

## 5. Database and Security

- Follow existing Drizzle schema and relation patterns.
- Export new schemas and relations through `src/drizzle-DB/schema.ts`.
- Generate a migration for schema changes.
- Every institute query must be scoped to the correct `instituteId`.
- Global default records use `instituteId: null`.
- Use existing authentication and permission checks.
- Never expose secrets or commit `.env` values.
- Follow the project's existing soft-status pattern instead of hard-deleting records when appropriate.

## 6. Forms and UI

- Use React Hook Form + Zod validation.
- Reuse components from `components/forms/`, `components/ui/`, and `components/modal/`.
- Follow existing table patterns in the feature you're modifying.
- Prefer Server Components. Use `"use client"` only when needed.
- Follow the existing Tailwind styling and toast patterns.

## 7. Before Finishing

1. Check the changed files for TypeScript and lint errors.
2. Run `pnpm build` when possible.
3. Verify institute-level data isolation and permissions.
4. Do not introduce unrelated changes or leave debug logs.
5. Briefly report what changed, which files changed, and any remaining issues.

**Golden rule:** Understand how this project already works, follow its patterns, reuse its utilities, and implement the smallest complete solution.
