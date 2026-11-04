# Security & Correctness Audit — Fix Log

Full-codebase audit of Educare (school_saas), read-only. Every finding below was
verified by direct source reading (CRITICAL/HIGH including Better Auth's installed
`dist` source). Follow AGENTS.md, follow existing patterns, minimal diffs, no new
packages. Fix in the order listed — items 1–4 close the critical paths.

Conventions to respect while fixing:
- Tenant tables: strict `eq(x.instituteId, ctx.instituteId)`.
- Global-default tables (classes, subjects, subject_assignments, exams,
  exam_mark_types): `or(isNull(x.instituteId), eq(x.instituteId, ctx.instituteId))`
  on reads; superadmin writes target `isNull(instituteId)` rows only.
- Roles: `superadmin` (platform, ctx.instituteId=""), `admin` (institute),
  `user` (teacher — has a real Better Auth login).
- Server actions are public RPC endpoints: every mutation needs its own role
  check; page-level `AccessServer` does NOT protect them.
- Result format: `{ success: true, data }` / `{ success: false, error, details }`.

---

## 1. CRITICAL — Better Auth: institute admin can take over the platform

**File:** `src/better-auth/auth.ts:9-50`
Institute `admin` is bound to the stock `adminAc`
(`node_modules/better-auth/dist/plugins/admin/access/statement.mjs`), granting
`user: [create, list, set-role, ban, impersonate, delete, set-password,
set-email, get, update]`. Every `/admin/*` route under `/api/auth/[...all]`
gates only on these permissions; role validity is checked only against the
registered roles map — `adminRoles` is not extra protection.

Exploit (any institute admin):
- `POST /api/auth/admin/set-role { userId: <self>, role: "superadmin" }`
- `POST /api/auth/admin/create-user { email, password, role: "superadmin" }`
- `POST /api/auth/admin/set-password { userId: <superadmin>, newPassword }`
- `POST /api/auth/admin/list-users` (enumerates every account on the platform)

**Fix:** bind institute admins to a restricted access controller and remove
them from `adminRoles`:

```ts
// better-auth 1.6.23 — createAccessControl from better-auth/plugins access API
const ac = createAccessControl({ user: ["create","list","set-role","ban","impersonate","delete","set-password","set-email","get","update"], session: ["list","revoke","delete"] });
const instituteAdminAc = ac.newRole({ user: ["create"], session: [] });

plugins: [
  admin({
    roles: { superadmin: adminAc, admin: instituteAdminAc, user: userAc },
    adminRoles: ["superadmin"],
    defaultRole: "user",
  }),
  nextCookies(),
],
```

**Cascade:** in `app/dashboard/teachers/_actions/teacher.action.ts` `addTeacher`,
remove `role: "user"` from the `auth.api.createUser` body — passing a role
requires the `set-role` permission you are removing; the default role already
resolves to `"user"`.

---

## 2. CRITICAL — unauthenticated mutations in all `app/super-admin/(main)/**/_actions`

Server actions here are public RPC endpoints with **no session check at all**
(no `getUserContext()` call). Verified in full for subjects; same pattern in
siblings:

- `subjects/_actions/subjects.action.ts:75` `changeStatussubjects` — flips any subject (global or tenant) by id.
- `subjects.action.ts:106` `deletesubjects` — deletes any subject by id.
- `subjects.action.ts:245` `uncombineSubject` — rewrites `combineWith`/`combineLabel` platform-wide, no auth at all.
- `subjects.action.ts:169` `combineSubjects` — session required but updates use `where(eq(id))` with no institute filter → any logged-in teacher modifies global subjects.
- `subjects.action.ts:27` `getDefaultSubjects` — unauthenticated read (global rows only; LOW).
- `classes/_actions/classes.action.ts:65,96` — toggle/delete without guard.
- `groups/_actions/groups.action.ts:82,113,133-184` — toggle/delete groups, rewrite `group_classes` by `groupId` only.
- `exam/_actions/exam.action.ts:100,130-197,251,335` — toggle exams/mark-types/grade-ranges; `assignExamToClasses` deactivates tenant `exam_classes` rows and inserts NULL-institute rows.
- `exam/_actions/defaultMark.action.ts:41-117` `postDefultSubjectMark` — unguarded upsert/delete of `subject_mark_templates`; `:17-25` `getDefaultSubjectMark` — `findMany` with **no `where`**, returns every tenant's subjects + mark templates.
- `exam/_actions/exam-overview.action.ts:44-120` `getPlatformExamOverview` — no guard (its sibling `platform.action.ts:56` has one).
- `academic-sessions/_actions/academicSession.action.ts:46-92` — toggle/delete shared sessions (delete cascades sections/enrollments).
- `institutes/_actions/institute.action.ts:8-58` — **anonymous toggle/delete of institutes**; delete also fails on `audit_logs.institute_id` FK `restrict` and returns a misleading message.

**Fix:** wrap every mutation in the existing `requireSuperAdmin()` pattern
(`super-admin/(main)/superadmins/_actions/superadmin.action.ts:27-41`; reuse the
`AccessServer("superadmin")` call from `platform.action.ts:56`). For default-table
writes, scope `where` with `isNull(instituteId)`. For `getDefaultSubjectMark`,
add `where: isNull(subjectDbSchema.instituteId)`.

---

## 3. CRITICAL — cross-tenant exposure via unfiltered nested Drizzle relations

`with:` relations in `db.query.*.findMany` are never tenant-scoped implicitly.
Global classes anchor the leak — every tenant's sections, group links, teacher
names, and aggregate student counts are readable:

1. `app/dashboard/classes/_actions/classes.action.ts:30-32` `getClasses` — `with: { sections: true }` → all tenants' sections.
2. `classes.action.ts:92-103` `getClassAndSection` — outer `where` = `eq(classId)` only, no institute filter at all; ignores the `instituteId` arg.
3. `classes.action.ts:124-136` `getClassSectionGroups` — `sections: true` unfiltered (feeds student-add form).
4. `app/dashboard/exam/_actions/examOverview.action.ts:46-54` `getSingleExamData` — `assignClasses → class → sections: true`.
5. `app/dashboard/exam/_actions/monitoring.action.ts:601-629` `getExamUnitScopes` — section/subject-assignment joins lack institute predicates → other tenants' teacher names on the monitoring dashboard.
6. `monitoring.action.ts:672-684` `getRequiredCells` — enrollments counted per `sectionId` with no `instituteId` predicate → cross-tenant student counts pollute progress.

**Fix:** add the institute predicate to every nested tenant-table relation
(`where: (t, { eq }) => eq(t.instituteId, ctx.instituteId)`), mirroring the
correct pattern in `markInput.action.ts:128-139`.

---

## 4. CRITICAL — teacher can hijack the institute profile

**Files:** `src/server-actions/shared/get-user-profile.action.ts:60-101`,
`src/validation/institute-profile.zod.ts`

`instituteProfileUpdate` checks session only (no role), and
`createUpdateSchema(instituteProfile)` leaves `id`, `userId`, `eiin`, `status`
client-writable. Any teacher (has a `teachers` row) can repoint
`instituteProfile.userId` to their own account, rewrite EIIN/name, or set
`status: "LEFT"`.

**Fix:** add `if (role !== "admin") return unauthorized` (get role from
`requireUserContext()`), and rebuild the zod schema with `.pick()` over only:
`nameBangla, nameEnglish, logo, signature, phone, division, district, upazila`.

---

## 5. HIGH — teachers can invoke admin mutations (no role checks in actions/helpers)

CRUD helpers (`server-create-crud.ts:29`, `server-update-crud.ts:32`,
`server-delete-crud.ts:26`, `server-status.action.ts:19`) check session +
institute scope only, never role. Confirmed open to any teacher (role `user`):

- `teachers/_actions/teacher.action.ts:164` `deleteTeacher` (hard delete; cascades assignments), `:176` `editTeacher`.
  (`addTeacher` is incidentally blocked by Better Auth's `user:["create"]` permission — keep it safe during the C-1 fix.)
- `teacher-assignment/_actions/teacher-assignment.action.ts:70,155,204` — assign/unassign class+subject teachers.
- `students/_actions/student.action.ts:99` `ToggleStudentStatus`.
- `exam/_actions/exam.action.ts:28-233` — `postExam`, `ToggleExamStatus`, `assignExamClasses`, `postMarkTypes`/toggle, `postGradeRange`/toggle (teacher can change the grade scale → all live results change).
- `groups/_actions/groups.action.ts:85,97` `createGroup`/`toggleGroup`.
- `classes/_actions/classes.action.ts:152,172` `postClasses`/`ToggleClassStatus` + subjects actions.

**Fix:** `if (ctx.role !== "admin") return { success: false as const,
error: "Not authorized", details: {} }` at the top of each mutation (pattern:
`monitoring.action.ts:66-81`), or centrally in the four CRUD helpers.

## 6. HIGH — tenant admin can finalize/publish/reopen GLOBAL exams

**File:** `app/dashboard/exam/_actions/markEditRequest.action.ts:558-615`
Existence check accepts `or(isNull(exams.instituteId), eq(...))`, but
`tx.update(exams).set({markWorkflow...}).where(eq(exams.id, examId))` is
unscoped → any tenant admin flips a platform-shared exam for all institutes.

**Fix:** update with
`and(eq(exams.id, examId), eq(exams.instituteId, instituteId))` and reject
workflow changes on NULL-institute rows. Also: re-read the exam `FOR UPDATE`
inside the tx and re-validate the transition (TOCTOU), and build the snapshot
plan after locking marks.

## 7. HIGH — `postClasses` sets the academic session id as the class PRIMARY KEY

**File:** `app/dashboard/classes/_actions/classes.action.ts:163-168`
`additionFields: { status: "ACTIVE", id }` with `id = session.id` → one class
per institute ever; second insert violates the PK.

**Fix:** remove `id` from `additionFields` (check whether `sessionId` belongs on
`classes` as a column instead — follow the schema).

## 8. HIGH — `assignExamClasses` IDOR

**File:** `app/dashboard/exam/_actions/exam.action.ts:80-132`
No ownership validation of `examId`/`classId` — pairs caller's instituteId with
any existing UUID; combined with item 3, a foreign classId surfaces the victim's
sections/counts in monitoring. **Fix:** verify exam scope
(`or(isNull, eq(instituteId))`) and each class belongs to institute-or-global
before the transaction (see `assertScopeAccess`, `markEditRequest.action.ts:50-144`).

## 9. HIGH — `getActiveClasses` always returns zero rows

**File:** `classes.action.ts:55-58` — `and(isNull(instituteId),
eq(instituteId, ...))` is a contradiction. Replace with the `or(isNull, eq)`
rule or remove the function if unused.

## 10. HIGH — `addTeacher` orphans Better Auth accounts

**File:** `teacher.action.ts:38-62` — `auth.api.createUser` runs outside the
transaction; if the `teachers` insert fails (duplicate institute email), a live
login remains, and the email is permanently burned. **Fix:** pre-check email,
map the unique-violation to a readable error, or compensating-delete the auth
user on failure.

---

## 11. MEDIUM — results & mark-entry (exam engine)

- **M-1 `result.action.ts:582-606`** grade-scale query unions global+institute rows despite the "institute overrides" comment; `findMany` has no `orderBy` and `gradeFor` (`_lib/result-calculator.ts:166-181`) floor-match tie-breaks nondeterministically → grades can flip between requests / diverge from snapshots. Fix: institute-first query with fallback to globals + deterministic order.
- **M-2 `markInput.action.ts:189-411`, `:897-990`** teachers can read any section's mark sheet and the full correction history institute-wide (only editing is gated). Add the `sectionSubjectTeachers` existence check (`markInput.action.ts:808-820`) when `role !== "admin"`.
- **M-3 `result.action.ts:91,251,282`** `getExamResult`/`getResultSnapshot`/`getPublishReadiness` have no role check; teachers can pull full result sheets for any class, including unpublished. Also gate print: `app/print/results/[examId]/[classId]/[report]/page.tsx:26,43-45` renders results without checking `markWorkflow === "PUBLISHED"` — add `notFound()`/error when not published.
- **M-4 `markInput.action.ts:850-864`, `:582-587, :644-646`** an APPROVED edit request is a permanent unlock and its `approvedById`/reason get stamped on later unrelated ADMIN corrections (audit misattribution). Consume the request on the next SUBMITTED save; only attach request metadata when the save actually needed it.
- **M-5 `markEditRequest.action.ts:212-231`** no partial-unique against duplicate PENDING edit requests — add partial unique index `(institute_id, exam_id, section_id, subject_id) WHERE status='PENDING'` (schema `exam-mark-edit-request.drizzle.ts:57-65`).
- **M-6 `markInput.action.ts:515-537,565-579`** absent rows skip mark-type validation but still insert junk `exam_marks`; duplicate `markTypeId` in one row crashes the save ("cannot affect row a second time"). Validate regardless of `absent`; dedupe/reject duplicates.
- **M-7 `monitoring.action.ts:465-471`** `getSubjectMonitoring.canEdit` ignores the workflow lock for admins. AND it with `checkMarkLock`. Also `:421-456`: teacher authorization takes one arbitrarily-ordered assignment row (`limit(1)` no `orderBy`) — use an existence check.
- **M-8 `markEditRequest.action.ts:721-731` × `result.action.ts:144-218`** publish issues ~6 serial queries per class and loops classes serially → 6C+ round trips on the Neon pooler. Hoist the shared lookups, `Promise.all` per-class builds.

## 12. MEDIUM — tenancy / accounts / uploads

- **M-9 `signup.action.ts:96-129`** already-onboarded admins can create extra institutes; `institute_profile.user_id` has no unique constraint (`institute-profile-schema.drizzle.ts` — only `eiin` unique); `verifyUser` (`profile/_actions/get-institute-profile.ts:31`) is a `findFirst` with no `orderBy` → nondeterministic tenant resolution (wrong institute name/logo on printed ID cards). Fix: reject when an institute already exists for the user (+ optional `unique` migration).
- **M-10 `institute.action.ts:8-36` vs. everything else** deactivating an institute is cosmetic — **nothing** reads `instituteProfile.status` for authorization (display-only at `dashboard/profile/page.tsx:156`). Enforce in `getUserContext`/`verifyUser` (reject when not ACTIVE) and/or a Better Auth sign-in hook.
- **M-11 `app/api/cloudinary/upload/route.ts:34`** `folder` is client-controlled; signature covers it so it's "valid", but paths aren't tenant-scoped. Server-derive: `educare/{instituteId}/{prefix}` with prefix whitelisted (`students|teachers|profile`).
- **M-12 `signup.action.ts:132-167` `adminProfileAction`** calls `requireUserContext()`, which requires a `teachers` row that does not exist yet at onboarding step ADMIN → login/onboarding redirect loop. Derive the institute from `instituteProfile.userId` (as `verifyUser` does).
- **M-13 raw errors to client** — `String(error)` / `error: error` / `error.message` returned from ~15 action files (e.g. `server-read-crud.ts:100-106` returns the raw Error object; `student.action.ts:49`; `teacher.action.ts:110`; `teacher-assignment.action.ts:113,148,197,395`; dashboard classes/subjects/groups; super-admin reads). Log server-side, return static strings.

## 13. LOW / INFO

- `teacher-assignment.action.ts:225-274` `assignSubjectTeacher` — check-then-insert race; existence check ignores soft-deleted rows → unique violations surface as generic errors.
- `teacher.action.ts:164-171` `deleteTeacher` orphans the auth login; `editTeacher` desyncs email from the auth account. Ban/disable the auth user on delete; align email flows.
- `student.action.ts` — `addStudent` writes no audit log (update does, `:396-404`); duplicate `studentId` returns a generic error.
- `app/dashboard/_actions/session.action.ts:9-13` `getActiveSession` — unauthenticated, no `orderBy`, multiple ACTIVE sessions possible → nondeterministic pick.
- `student.drizzle.ts:51-54`, `enrollments.drizzle.ts:44-46` — `onDelete: "cascade"` from `groups` to students/enrollments: deleting a group deletes its students. Use `set null`.
- `src/validation/classes.zod.ts` — `createInsertSchema(classesDrizzle)` leaves `id`/`status` client-settable (currently mitigated because `createRecord` stamps `instituteId` last — still tighten with `.omit()`); `student.zod.ts` strings (`className`/`section` `max(500)`) used as FK fields; `exam.zod.ts:59-63` no min≤max cross-check on grade bands.
- `createAuditLog` IP comes from client-spoofable `x-forwarded-for` (`audit-logs/createAuditLog.action.ts:24`).
- `server-status.action.ts:53-58` — `toggleStatus` forces any non-ACTIVE status to ACTIVE; safe on `enrollments` (binary enum) but destructive if ever reused on `student`/`institute_profile` (4-value `studentStatusEnum`). Guard the helper.
- `super-admin/(main)/superadmins/_actions/superadmin.action.ts:177` `demoteToUser` — target sessions not revoked; stale superadmin authority survives up to the cookieCache TTL. Call the Better Auth session-revoke admin API after role change.
- `super-admin-status.action.ts:16-70` `statusChangeSuperAdmin` — dead code today; if reused, add `isNull(instituteId)` scoping.
- `server-create-crud.ts:51-55` — unconditional `instituteId` insert breaks the superadmin global-default path (`""` is not a valid uuid) for `postExam`, `postMarkTypes`, `postGradeRange`, `assignExamClasses` (institute creation of these rows also affected). Skip the field when `role === "superadmin"` so it lands NULL.
- `proxy.ts:27-32` — `next` param is dead code (login page never consumes it). No open-redirect risk; remove or wire up.
- `readMultipleRecords` (`server-read-multiple-action.ts:43-47`) — zero call sites; strict `eq(instituteId)` would drop global defaults if reused for content. Delete or fix now.
- `exam-default-mark.drizzle.ts:34-37` — allows `passMark = 0`; combined with a lowest band not named "F", a 0-mark student can "pass" (business rule, confirm intent — `_lib/result-calculator.ts:350`).
- `_lib/result-calculator.ts:235-237,369-379` — religion subjects count toward applicability but are excluded from the optional fail-exemption; optional subjects' GPAs are averaged into overall GPA regardless of weighting — confirm business intent.
- `exam-result-snapshot` quality is good (versioning + hash + per-class skip); `assignExamClasses` audit logs only new class ids, not deactivations.

## Verified SAFE (do not "fix")

Print ID-card scoping (`app/print/_actions/id-card.action.ts` — `requireInstitute` + per-page `AccessServer("admin")`); `/dashboard/students/[id]` IDOR (uuid-validated, double-scoped); mark-entry lock pipeline (teachers can't edit SUBMITTED without approval, can't self-approve; FINALIZED/PUBLISHED block all writes); snapshot frozen-payload design; `superadmin.action.ts` guards (role, self-demotion, last-superadmin); student CRUD scoping; all dashboard aggregate reads (770 lines, isolation-verified); Cloudinary signature (secret server-side, 5MB/images-only, admin-gated); proxy matcher coverage; no secret leakage to client bundles; no PII in logs.
