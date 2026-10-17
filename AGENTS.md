# AGENTS.md

Guidance for AI coding agents (Cline, Claude, Copilot, etc.) working in this repository.
`CLAUDE.md` only contains `@AGENTS.md`, so **this file is the single source of truth**.

---

## 1. What this project is

**school_saas / "Educare"** — a **multi-tenant school management SaaS** aimed at Bangladeshi
institutes (bilingual English / Bangla UI).

One deployment serves many institutes. Almost every business table carries an
`institute_id` (FK to `institute_profile.id`) and **all tenant data must be scoped to it**.
A platform-level **super-admin** area manages shared / "default" rows that every institute
inherits (academic sessions, classes, groups, subjects, exam templates). Default rows are
identified by a **`NULL` `institute_id`**.

Feature domains:

- Auth + multi-step onboarding (signup → institute profile → admin profile)
- Institute profile, academic sessions
- Classes & sections, groups (+ class↔group assignment)
- Subjects, subject assignment (per class / group, compulsory / optional / religion)
- Students + enrollments, teachers + teacher assignment (class teacher, subject teacher)
- Exams: mark types, grade ranges, exam creation, exam→class assignment, default marks
- Audit logs (created/updated/status-changed/deleted/logged-in)

---

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | **Next.js 16** App Router (RSC + Server Actions), **React 19** |
| Language | **TypeScript 5**, `strict: true`, path alias `@/*` → repo root |
| Styling | **Tailwind CSS v4** (`@import "tailwindcss"` in `app/globals.css`), theme via CSS variables |
| UI kit | **shadcn/ui** style on **Radix UI** + **Base UI** (`radix-ui`, `@base-ui/react`), `lucide-react` + `react-icons`, `framer-motion` |
| Forms | **React Hook Form** + `@hookform/resolvers/zod` |
| Validation | **Zod v4** + **drizzle-zod** (`createInsertSchema` / `createSelectSchema`) |
| Client data | **TanStack Query v5** (`useQuery` / `useQueryClient`) |
| Tables | **TanStack Table v9** (feature-registry `useTable`) |
| Charts | Recharts |
| Auth | **Better Auth** (`emailAndPassword` + `admin` plugin), Drizzle adapter |
| DB | PostgreSQL (Neon) via **postgres-js** + **Drizzle ORM** (`db.query.*` relational API) |
| Migrations | drizzle-kit → `drizzle/` folder |
| Toasts | `sonner` (`toast.success` / `toast.error`) |
| Package manager | **pnpm** (there is a `pnpm-lock.yaml` — do not use npm/yarn) |

---

## 3. Commands

There is **no test runner configured** in this repo. Validate changes with lint + build.

```bash
pnpm install          # install deps (pnpm only)
pnpm dev              # next dev  (http://localhost:3000)
pnpm build            # next build — the main correctness gate (type + lint checks)
pnpm start            # next start (after build)
pnpm lint             # eslint (eslint-config-next, core-web-vitals + typescript)
```

### Baseline lint state (verified)

`pnpm lint` **currently fails** with `28 problems (2 errors, 26 warnings)` — all pre-existing:

- **2 errors** — `@typescript-eslint/no-explicit-any` in
  `components/motion-primitives/animated-group.tsx` (lines 9 and 10).
- **26 warnings** — mostly `@typescript-eslint/no-unused-vars` in
  `components/bd-address/bd-address.jsx`, `app/super-admin/(main)/subjects/_table/subjectAssign-column.tsx`,
  `components/dashboard/sidebar.tsx`, `src/server-actions/auth/signup.action.ts`,
  `src/server-actions/crud-funtions/server-delete-crud.ts`, plus a `no-img-element` warning in
  `components/login-form.tsx` and the known `mark-config/oldpage.tsx` leftover.

So: don't assume lint was already clean, and **don't introduce new errors**. Verify your own files with
`pnpm exec eslint <path> --format unix` (clean files print nothing) instead of relying on the global exit code.

Drizzle (no npm scripts exist yet, so call the CLI directly):

```bash
pnpm exec drizzle-kit generate   # generate SQL migration from schema changes
pnpm exec drizzle-kit migrate    # apply migrations
pnpm exec drizzle-kit push       # push schema straight to DB (dev only)
pnpm exec drizzle-kit studio     # browse data
```

Config lives in `drizzle.config.ts` (`out: ./drizzle`, `dialect: postgresql`).

### Environment variables (`.env`)

```
DATABASE_URL                   # Neon Postgres connection string
BETTER_AUTH_SECRET             # Better Auth signing secret
NEXT_PUBLIC_BETTER_AUTH_URL    # e.g. http://localhost:3000
```

> `.env` is git-ignored. **Never print, hard-code, or commit secret values**, and prefer
> `process.env.X!` reads. If a secret leaks into a file/answer, flag it and recommend rotation.


---

## 4. Repository layout

```
app/                                  # Next.js App Router (routes ONLY live here)
  layout.tsx                          # root: fonts, ThemeProvider, QueryProvider, <Toaster/>
  globals.css                         # Tailwind v4 entry + theme CSS variables
  api/auth/[...all]/route.ts          # Better Auth HTTP handler (toNextJsHandler)
  (main)/                             # public marketing home + /unauthorize
  auth/                               # login + onboarding/{signup,institute-profile,admin-profile}
  dashboard/                          # TENANT app (admin + teachers) — wrapped in DashboardShell
    layout.tsx                        # enforces onboarding via getOnboardingStep()
    <feature>/                        # academic-sessions, classes, groups, subjects, students,
                                      # teachers, teacher-assignment, exam, profile
      page.tsx                        # server component; guards with AccessServer(...)
      <Feature>Page.tsx               # the actual view (server or client)
      _actions/*.action.ts            # "use server" actions for this feature
      _table/column*.tsx              # TanStack column definitions
      _component(s)/*.tsx             # feature-local presentational components
      _schema/*.zod.ts                # feature-local zod schemas
  super-admin/(main)/                 # PLATFORM admin area (default/global data)
components/                           # shared UI (repo root, NOT under src/)
  ui/                                 # shadcn/ui primitives (button, dialog, table, form, ...)
  forms/                              # FormInput, FormSelect, FormTextarea, FormCheckbox(Group), ...
  table/tanstack/                     # DataTable + features + sortable-header
  table/data-table.tsx                # older/simpler AppTable (still used by some pages)
  dashboard/                          # Sidebar, Topbar, DashboardShell, stat cards, charts, ...
  modal/                              # delete-modal, status-modal, status-toggle-modal
  home/, motion-primitives/, bd-address/
utils/utils.ts                        # cn() (see gotcha #2)
src/                                  # all non-route application code
  better-auth/auth.ts                 # server auth instance  (root ./auth.ts re-exports it)
  better-auth/auth-client.ts          # client: signIn, signUp, useSession
  drizzle-DB/index.ts                 # export const db = drizzle(client, { schema })
  drizzle-DB/schema.ts                # barrel: re-exports every schema file
  drizzle-DB/schema/*.drizzle.ts      # table + relations + enums per domain
  server-actions/                     # generic, reusable server logic (see §6)
  validation/*.zod.ts                 # shared zod schemas + inferred types
  tanstackQuery/provider.tsx          # QueryProvider used in root layout
  tanstackQuery/queryReturnDataFn.ts  # fetchData() helper: unwraps {success,data}
  lib/utils.ts, lib/*                 # cn(), dashboard mock data, current-session
  data/bd-geo-location/*.json         # BD divisions / districts / upazilas
drizzle/                              # generated SQL migrations + meta (commit these)
schema.md                             # early design sketch of the schema (reference only)
```

### Path aliases — important

`tsconfig.json` defines **only** `"@/*": ["./*"]` (root-relative). So imports look like:

```ts
import { db } from "@/src/drizzle-DB";                     // src/
import { toast } from "sonner";
import { Button } from "@/components/ui/button";            // components/ (root)
import { cn } from "@/utils/utils";                         // utils/utils.ts
import { cn } from "@/src/lib/utils";                       // src/lib/utils.ts
import { auth } from "@/auth";                              // root auth.ts → src/better-auth/auth
import { AccessServer } from "@/src/server-actions/protected-routes/role-access-server";
import { useQuery } from "@tanstack/react-query";
```

`components.json` (shadcn) declares aliases like `"utils": "@/lib/utils"` and `"hooks": "@/hooks"`,
but **`/lib` and `/hooks` do not exist at the root** — real files are `utils/utils.ts` and
`src/lib/utils.ts`. When adding shadcn components, fix the generated import to a resolvable path.


---

## 5. Auth, tenancy & access control

### Better Auth

- Server instance: `src/better-auth/auth.ts` (`emailAndPassword`, `admin()` and
  `nextCookies()` plugins, Drizzle adapter with `provider: "pg"`).
  Root `auth.ts` just re-exports it; server actions import `auth` from `@/auth`.
- Client: `src/better-auth/auth-client.ts` exports `authClient`, `signIn`, `signUp`, `useSession`.
- HTTP handler: `app/api/auth/[...all]/route.ts`.
- Roles come from the `user_role` enum: **`"admin" | "user"`** (`src/drizzle-DB/schema/auth-schema.drizzle.ts`).
- `currentUser()` (`src/server-actions/auth/currentUser.action.ts`) = `auth.api.getSession({ headers })`.

### Tenant context (the core of this app)

`getUserContext()` (`src/server-actions/shared/get-user-context.action.ts`) resolves the session,
looks up the matching `teachers` row, and returns:

```ts
{ userId, role, instituteId, teacherId }
```

- Return `null` when unauthenticated → actions fail gracefully with
  `{ success: false, error: "No User session found..." }`.
- `requireUserContext()` is the variant that `redirect("/auth/login")` when missing.
- **Every tenant-scoped query must filter by `instituteId`.** That is why the generic CRUD
  helpers (§6) inject it automatically and why actions use
  `or(isNull(table.instituteId), eq(table.instituteId, instituteId))` to also read global
  default rows.

### Route guards

- Server components: `const { allowed } = await AccessServer("admin")` then
  `if (!allowed) redirect("/unauthorize")` (see `app/dashboard/classes/page.tsx`).
- Client components: `AccessClient(role | role[])` returns `{ allowed, role }`; redirect inside
  a `useEffect` (never during render).
- `app/dashboard/layout.tsx` enforces onboarding order through `getOnboardingStep()`:
  `UNAUTHORIZED → INSTITUTE → ADMIN → COMPLETE` (the signup flow force-sets new users to `admin`).

---

## 6. Data access layer (`src/server-actions/crud-funtions/`)

> Note the folder name is misspelled (`funtions`). Keep it as-is for consistency unless you
> deliberately rename it everywhere.

Generic, reusable helpers. **Prefer these over ad-hoc `db.insert/update` in feature actions.**

| File | Export | Purpose |
| --- | --- | --- |
| `server-create-crud.ts` | `createRecord({ zodSchema, drizzleSchema, additionFields?, entity }, data)` | validates, injects `instituteId`, inserts in a transaction, writes audit log `CREATED` |
| `server-read-crud.ts` | `readRecord({ drizzleSchema })` | selects where `instituteId = ctx.instituteId` (returns an **array**) |
| `server-read-crud.ts` | `readMany({ drizzleSchema, where?, query? })` | the workhorse: pass a `query({ db, instituteId })` callback for relational queries with `with:`, joins, ordering |
| `server-read-multiple-action.ts` | `readMultipleRecords([{ key, drizzleSchema }, ...])` | fetches several tables at once into `{ key: rows[] }` (tenants auto-filtered when the table has `instituteId`) |
| `server-update-crud.ts` | `updateRecord({ ... }, id, data)` | validated update scoped by `id` + `instituteId`, transaction + audit log |
| `server-delete-crud.ts` | `deleteRecord({ drizzleSchema, entity }, id)` | scoped delete in a transaction + audit log `DELETED` |
| `server-status.action.ts` | `toggleStatus({ drizzleSchema, entity }, id)` | flips `ACTIVE` ⇄ `INACTIVE` (or boolean), transaction + audit `STATUS_CHANGED` |
| `super-admin/super-admin-create-crud.ts` | `CreateSuperAdmin({ zodSchema, drizzleSchema, additionFields? }, data)` | **no auth / no tenant scoping** — for global default rows |
| `super-admin/super-admin-status.action.ts` | `statusChangeSuperAdmin({ drizzleSchema }, id)` | status toggle without tenant scoping |
| `client-post-action.ts` | `handleCrudAction(action, data, { successMessage, onSuccess, onError, resetForm })` | client wrapper: calls the action, toasts success/first validation error, invalidates/callbacks |
| `client-read-action.ts` | `clientReadAction(action, { onSuccess, onError, onLoading })` | client read wrapper with loading + toast |

### Canonical result shape

Every server action returns the `ValidationResult<T>` union from
`src/validation/validator.zod.ts`:

```ts
{ success: true,  data: T }
| { success: false, error: string, details: Record<string, string[] | undefined> }
```

`parseWithZod(schema, data)` builds the failure branch from `error.flatten().fieldErrors`.
Never `throw` across the server-action boundary — return the union instead.

### Registering a new audited entity

1. Add the value to `auditEntityEnum` in `src/drizzle-DB/schema/audit-logs/auditLogs.drizzle.ts`.
2. Generate/apply a migration (enums require a DB change).
3. Pass that `entity` name to the CRUD helper.

Audit actions: `CREATED | UPDATED | STATUS_CHANGED | DELETED | LOGGED_IN`.
`createAuditLog(tx, {...})` also captures IP (`x-forwarded-for`) and user-agent from headers.


---

## 7. Conventions you must follow

### Server actions & files

- Feature actions live in `app/<area>/<feature>/_actions/*.action.ts` and start with
  `"use server";`. Shared/reusable logic lives in `src/server-actions/`.
- Export `async function`s named `getX`, `postX`/`createX`, `updateX`, `deleteX`, `toggleXStatus`.
- Compose the generic helpers; only drop to raw `db` (inside `db.transaction`) when the logic
  genuinely doesn't fit (e.g. multi-table onboarding).
- Server actions are the ONLY data entry point from the client. Do not fetch the DB from
  client components.
- Type the return explicitly with `as const` on the success/error flags so the union narrows.
- Add `"use server"` to any module whose exports are called from the client.

### Validation / types

- Shared schemas: `src/validation/*.zod.ts`. Feature-local schemas:
  `app/<...>/_schema/*.zod.ts` (e.g. `exam.zod.ts`).
- Prefer `createInsertSchema(pgTable)` / `createSelectSchema(pgTable)` from `drizzle-zod`, then
  `.omit({ id: true, instituteId: true })` and refine messages.
- Import **Zod v4** helpers directly (`z.uuid()`, `z.email()`, `{ error: "..." }`) — not the
  deprecated `z.string().email()` style, even though a few legacy files still use it.
- Export both the schema **and** the inferred type (`Input…Type`, `Output…Type`).
- The `statusEnumValues = ["ACTIVE","INACTIVE"]` list lives in `src/validation/subjects.zod.ts`
  and is reused by other validators.

### Feature-folder pattern

Underscore-prefixed folders are **private** (not routes): `_actions`, `_table`, `_component(s)`,
`_schema`. A typical feature folder is:

```
<feature>/
  page.tsx          # server: guard + render view
  <Feature>Page.tsx # view (server-rendered table or "use client" form)
  _actions/*.action.ts
  _table/columns.tsx        # createColumnHelper() + DataTableColumnHeader
  _component[s]/*.tsx
  _schema/*.zod.ts
```

### UI patterns

- **Forms**: React Hook Form + `zodResolver`, wrapped in `<FormProvider {...methods}>`, using the
  shared field components in `components/forms/` (`FormInput`, `FormSelect`, `FormTextarea`,
  `FormCheckbox`, `FormCheckboxGroup`, `FormSwitch`, `FormInputNumber`, `FormDatePicker`).
  Each takes `control`, `name`, `label`, `placeholder`, and `description` (usually the
  `form.formState.errors.x?.message`). Submit through `handleCrudAction(...)`. See
  `components/forms/form-ussage.txt` for copy-paste examples.
- **Tables**: `components/table/tanstack/data-table.tsx` (`<DataTable columns data />`) with
  columns from `_table/columns.tsx`. A legacy `components/table/data-table.tsx` (`AppTable`
  with `searchable` / `selectable` props) is still used on the teachers page — match whichever
  the file you touch already imports. Usage samples: `components/table/table-ussage.txt`.
- **Client data**: TanStack Query with string-array `queryKey`s; unwrap actions via
  `fetchData()` (`src/tanstackQuery/queryReturnDataFn.ts`) or inline
  `if (!result.success) throw new Error(result.error)`. After a mutation call
  `queryClient.invalidateQueries({ queryKey: [...] })`. Examples: `src/tanstackQuery/ussage.txt`.
- **Modals**: reuse `components/modal/{delete-modal,status-modal,status-toggle-modal}.tsx`.
- **Toasts**: `sonner` only (a `<Toaster/>` is mounted in the root layout). `handleCrudAction`
  already toasts, so don't double-toast.
- **Styling**: Tailwind utility classes with theme tokens (`bg-background`, `text-muted-foreground`,
  `border-sidebar-border`, `size-9`, …). Use `cn()` to merge classes. Dark mode is class-based.
- **Icons**: `lucide-react` primary, `react-icons/*` where already used.
- Prefer server components; add `"use client"` only when state/hooks/events are needed.


---

## 8. Database & Drizzle rules

- Single `db` instance in `src/drizzle-DB/index.ts`; `schema.ts` is the barrel that must re-export
  every new schema module (otherwise `db.query.<name>` and drizzle-kit lose it).
- Table files are named `*.drizzle.ts` and conventionally export
  `export const xDrizzle = pgTable("snake_case_name", { ... })`, relations as
  `export const xRelations = relations(...)`, plus
  `export type OutputXType = typeof x.$inferSelect` / `InputXType = typeof x.$inferInsert`.
- Reuse `timestamps` (`createdAt` / `updatedAt`) and enums from
  `src/drizzle-DB/schema/enums-drizzle.ts` (`statusEnum`, `genderEnum`, `religionEnum`, …).
- Add `unique(...)` / `index(...)` in the table's second-argument callback; index tenant columns
  (`instituteId`) and FKs.
- Foreign keys to `instituteProfile.id` use `onDelete: "cascade"`; audit-log/user FKs use
  `"restrict"`.
- Nested schema folders exist (`schema/exam-managment/`, `schema/audit-logs/`). `drizzle.config.ts`
  currently points at `./src/drizzle-DB/schema/*`; if a new nested file is ever missed by
  generate, broaden the glob to `./src/drizzle-DB/schema/**/*`.
- **Never edit an already-applied migration.** Change the schema, run
  `pnpm exec drizzle-kit generate`, and commit the new SQL + `drizzle/meta` snapshot.
- `institute_id` is nullable on many tables **on purpose** so super-admin "default" rows are
  global. Tenant reads therefore use `or(isNull(t.instituteId), eq(t.instituteId, ctx.instituteId))`.

---

## 9. Gotchas & known rough edges

Keep these in mind (and opportunistic fixes are welcome — mention them when you touch the code):

1. **Two `cn()` helpers** exist (`utils/utils.ts` and `src/lib/utils.ts`) and both are imported
   with different specifiers. Reuse the one already imported in the file you edit; don't mix.
2. **Misaligned shadcn aliases** — `components.json` points `utils`/`hooks` at `@/lib`/`@/hooks`,
   which don't exist at the root. Fix generated imports to `@/utils/utils` or `@/src/lib/utils`.
3. **Folder typo** — `src/server-actions/crud-funtions/` (not `functions`).
4. **`updateRecord` logs the wrong audit action** — it writes `action: "DELETED"` inside
   `server-update-crud.ts`; it should be `"UPDATED"`. Also has leftover `console.log("step-n")`
   debug statements to remove.
5. **`readRecord` returns an array**, not a single row (it uses `db.select()`); check callers.
6. **Role naming drift** — the live enum is
   `userRoleEnum = pgEnum("user_role", ["admin", "user"])`
   (`src/drizzle-DB/schema/auth-schema.drizzle.ts:11`), while
   `role-access-client.ts` types `Role = "admin" | "teacher" | "user"` and old migrations/snapshots
   (up to `drizzle/0045_*`) still say `("admin","teacher")` — migration
   `drizzle/0046_optimal_kabuki.sql` renamed it. Treat `"user"` as the teacher role unless you
   deliberately change the enum (and generate a new migration).
7. **Duplicated `(exam-settings)` route groups** under both `dashboard/` and `super-admin/`, plus
   a leftover `mark-config/oldpage.tsx`. Don't assume the two areas share components — verify.
8. **`students`/`classes` etc. may have `NULL` instituteId** for global rows — always allow for it.
9. **`schema.md` is a historical design sketch**, not generated output; don't treat it as truth.
10. Mixed absolute (`@/...`) and relative (`../../`) imports appear throughout. Prefer `@/...`
    in new code.
11. **Lint is red before you start** — 2 errors in `components/motion-primitives/animated-group.tsx`
    plus ~26 unused-var warnings (§3). Fixing them is a welcome, low-risk cleanup, but never leave the
    repo worse: run `pnpm exec eslint <changed files>` before handing work back.
12. **Leftover debug code is scattered around.** Verified occurrences of `console.log(`:
    `components/table/data-table.tsx` (`"problem here"`, inside a `React.useMemo`),
    `src/server-actions/crud-funtions/server-update-crud.ts` (`step-1 … step-4`),
    `app/dashboard/teachers/_actions/teacher.action.ts`,
    `app/dashboard/exam/_component/exam-assign-class.tsx`,
    `app/dashboard/subjects/_components/SubjectPage.tsx`,
    `app/super-admin/(main)/exam/_actions/defaultMark.action.ts`,
    `app/super-admin/(main)/exam/_component/MarkInputModal.tsx`, and the dead
    `mark-config/oldpage.tsx` (which also holds large commented-out blocks). Delete them opportunistically
    when you touch those files.

---

## 10. Definition of done for a change

1. `pnpm lint` — the **whole-repo** run fails on pre-existing errors (see §3 baseline), so check
   `pnpm exec eslint <file>` on the files you touched and make sure *you* added no new errors/warnings.
2. `pnpm build` (or `pnpm exec tsc --noEmit`) passes with no type errors.
3. New/changed DB fields: schema updated **and** a generated migration committed.
4. Tenant-safety preserved: reads/writes filtered by `instituteId` (or explicitly global via the
   super-admin helpers).
5. Server actions return the `{ success, data | error, details }` union; client code toasts via
   `handleCrudAction` / `clientReadAction`.
6. New audited entity registered in `auditEntityEnum`.
7. No secrets committed; no leftover `console.log` debug lines.

