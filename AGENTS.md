# AGENT.md — School SaaS Project Context

## 1. Project Overview

This project is a multi-tenant **School SaaS / School Result Management System**.

Primary goal:
- Manage school/institute academic and administrative data.
- Reduce repetitive CRUD implementation through reusable backend and frontend patterns.
- Support future exam, marks, result, HR, and reporting workflows.
- Preserve historical school data rather than physically deleting records.

The current focus is the **admin dashboard** and core academic setup.

---

## 2. Current Tech Stack

Use modern production conventions for:

- Next.js
- React
- TypeScript
- PostgreSQL
- Drizzle ORM
- Zod
- Better Auth
- shadcn/ui
- React Hook Form

Assume a server/client architecture with clear boundaries.

Prefer:
- Server-side data access for database operations.
- Server Actions where appropriate.
- Zod validation at action/API boundaries.
- Strong TypeScript typing.
- Drizzle relations for nested reads.
- Reusable CRUD utilities/components instead of duplicated page-specific logic.
- Database indexes and unique constraints for important lookup/relationship fields.

Avoid deprecated APIs and unnecessary client-side fetching.

---

## 3. Multi-Tenancy

The system is institute/school scoped.

Core rule:

**Every institute-owned record must be scoped to the authenticated institute.**

Authentication flow currently uses a reusable `verifyUser()` / `requireInstitute()` style helper to:
1. Verify the authenticated user.
2. Find the institute profile.
3. Return the institute ID.
4. Use that ID in database queries.

Never trust an institute ID supplied directly by the client when it can be derived from the authenticated session.

---

## 4. Data Deletion Policy

Use **soft disable/inactive behavior**.

Do NOT recommend hard deletion unless explicitly requested.

Reason:
School records may be referenced historically by:
- Students
- Enrollments
- Exams
- Marks
- Results
- Attendance
- Academic sessions
- Reports

Prefer fields such as:
- `status`
- `isActive`

Typical lifecycle:

`ACTIVE -> INACTIVE`

Historical records should remain queryable when required.

---

## 5. Academic Structure

The current academic model includes:

- Institute
- Academic Session
- Class
- Section
- Group
- Group-Class assignment
- Subject
- Subject assignment
- Student
- Student enrollment

Conceptual hierarchy:

Institute
→ Academic Session
→ Class
→ Section
→ Student Enrollment

Groups are an additional academic dimension:

Class
→ Group(s)
→ Subject Assignments / Student context

Example:

Class 9
- Science
- Arts
- Business Studies

Classes without real groups can use a universal/N/A group where appropriate.

---

## 6. Academic Session

Academic sessions are persistent entities.

A session normally contains:
- Name/title
- Start date
- End date
- Active status
- Institute ID

The active session is used by the application as the current academic context.

Do not assume that subjects, classes, or other academic entities should automatically be recreated every session. Determine whether the entity is global, session-specific, or assignment-specific before designing the schema.

---

## 7. Class and Section

Classes are currently represented as database entities.

The project initially uses hardcoded/common class names where practical, but the architecture should still use IDs and relations rather than relying on display names.

Sections belong to classes.

Use relations for nested reads instead of storing duplicated class/section names.

---

## 8. Groups

Groups represent academic streams such as:

- Science
- Arts
- Business Studies

A group can be assigned to multiple classes.

This is implemented through a junction table similar to:

`groupClasses`

Important constraint:

- One `(groupId, classId)` pair must be unique.

Do NOT store assigned class IDs as an array in the group record.

Use one junction-table row per relationship.

Example:

| groupId | classId |
|---|---|
| science | class-9 |
| science | class-10 |
| arts | class-9 |
| arts | class-10 |

Use Drizzle relations to retrieve nested class/group information.

---

## 9. Subjects

Subjects have fields such as:

- Name
- Short name
- Code
- Is religion subject
- Religion
- Status
- Institute ID

Subjects themselves should not automatically be duplicated for every academic session unless the domain explicitly requires session-specific subject records.

The relationship between subjects and academic classes/groups should be represented through an assignment/junction entity.

Expected conceptual model:

`SubjectAssignment`

Example:

- Class 9 + Science → Physics
- Class 9 + Science → Chemistry
- Class 9 + Arts → History

Again, use one database row per assignment, not an array of subjects.

---

## 10. Student Model

Student information and enrollment are conceptually separate.

Student record:
- Personal/student identity information.

Enrollment record:
- Academic placement/context.

Enrollment may contain:
- Student ID
- Academic session
- Class
- Section
- Group
- Roll
- Status

The admin UX should allow class, section, roll, and group to be selected while creating a student. There is no need for a separate enrollment page for the normal student-creation workflow.

Historical enrollments must be preserved.

---

## 11. CRUD Architecture

A major project goal is reducing repeated CRUD implementation.

Avoid creating unnecessarily different implementations for every module.

Common CRUD responsibilities should be reusable:

- Authentication/institute resolution
- Input validation
- Create
- Read one
- Read many
- Update
- Soft disable
- Error handling
- Success handling
- Toast behavior
- Table rendering
- Form dialogs/sheets

Existing/relevant helper pattern:

`handleCrudAction<T, R>()`

There is also a direction toward a reusable generic `readMany` utility that can support:
- schema/table
- filters
- relations / nested queries
- custom query behavior

However, do not over-generalize Drizzle queries to the point that TypeScript inference or relation support becomes weak.

Prefer type-safe abstractions over highly dynamic generic query builders.

---

## 12. Database Querying

Use Drizzle ORM.

For simple queries:

```ts
db
  .select()
  .from(table)
  .where(...)
```

For relational reads:

```ts
db.query.someTable.findMany({
  where: ...,
  with: {
    relation: true,
  },
})
```

When nested names are required, ensure:
1. The relation is correctly declared.
2. The relation key used in `with` matches the relation definition.
3. The frontend maps the nested response into table-friendly display values.

Do not duplicate related entity names in the base table just to simplify UI rendering.

---

## 13. Frontend UI Architecture

The project uses shadcn/ui.

Preferred UI:
- Data tables
- Right-side Sheet panels for create/edit
- Dialogs only when appropriate
- Input
- Button
- NativeSelect / Select
- Card
- Avatar
- Spinner
- Form components
- Dropdown actions

The user prefers **right-side panels/sheets** for better CRUD UX.

Avoid creating separate pages for every simple create/edit action when a Sheet is sufficient.

---

## 14. Reusable Frontend CRUD Components

The project has recognized that repeatedly building:

- table
- search
- filters
- add button
- edit action
- status toggle
- form
- loading state
- empty state
- confirmation
- pagination

for every page is too time-consuming.

When designing new modules, first consider whether an existing reusable component/configuration can handle the UI.

Potential architecture:

```text
components/
  crud/
    data-table/
    crud-sheet/
    crud-form/
    status-toggle/
    empty-state/
    pagination/
```

Keep domain-specific behavior outside the generic component.

Example:

```text
generic CRUD UI
        +
subject-specific schema/config
        +
subject-specific server action
```

---

## 15. Validation

Use Zod schemas as the canonical validation layer.

Example pattern:

```ts
export const addSubjectZod = z.object({
  ...
});

export type AddSubjectType = z.infer<typeof addSubjectZod>;
```

React Hook Form should use the inferred type.

Be careful with:
- `Date`
- `z.coerce.date()`
- resolver type compatibility
- optional vs nullable values
- enum values

Prefer consistent form defaults that exactly match the inferred TypeScript type.

---

## 16. Authentication / Authorization

Better Auth is used for authentication.

Never perform institute-scoped database operations without first resolving the authenticated institute.

Future authorization will include role-based routes/permissions.

Role-based route protection is planned but not yet fully implemented.

Do not assume every authenticated user can perform every admin action.

---

## 17. Current Implementation Status

Completed / substantially implemented:

- Authentication/session
- Teacher
- Student
- Class
- Section
- Subject
- Group
- Group-Class assignment
- Subject CRUD
- Subject assignment work in progress

Still planned:

- Exams
- Marks
- Results
- Attendance
- HR/administration modules
- Role-based route/permission system
- Reporting
- More reusable CRUD infrastructure
- English/Bangla language toggle

The language system is planned after the subject-related work is stable.

---

## 18. Important Domain Decisions

### Do not store many-to-many relationships as arrays

Bad:

```text
group.classIds = ["class9", "class10"]
```

Good:

```text
groupClasses
groupId | classId
```

Likewise, subject assignments should use one row per assignment.

### Use relations for nested reads

If the UI needs:

```text
Group: Science
Classes: 9, 10
```

retrieve the related classes through Drizzle relations and transform them for presentation.

### Keep domain data normalized

Do not denormalize names such as class name or group name into unrelated tables unless there is a measured reason.

IDs should represent relationships.

---

## 19. Historical Data Rule

The system must support historical academic data.

Examples:

A student can be:
- Class 8 in 2025
- Class 9 in 2026

Do not overwrite historical enrollment data.

Likewise, changing a group's active status or a subject assignment must not corrupt previous exam/result records.

---

## 20. Future Result Architecture

Exam/result functionality will likely depend on:

- Academic session
- Class
- Section
- Group
- Subject assignment
- Student enrollment
- Exam
- Exam subject/configuration
- Marks
- Grading
- Result publication

When designing these modules, preserve the academic context required to reproduce historical results.

Avoid designing the result system around only the student's current class/group.

---

## 21. Query / UI Performance

For production code:

- Index foreign keys.
- Add composite indexes for common filters.
- Add unique constraints for natural relationship uniqueness.
- Avoid N+1 queries.
- Prefer relational queries or batched queries.
- Select only required fields for large tables.
- Add pagination for potentially large student/result tables.
- Avoid fetching entire datasets to the client when server-side filtering is practical.

---

## 22. Naming Conventions

Use consistent naming.

Examples:

- `academicSessions`
- `classes`
- `sections`
- `groups`
- `groupClasses`
- `subjects`
- `subjectAssignments`
- `students`
- `enrollments`

Keep database naming and TypeScript naming predictable.

Do not introduce a second naming convention without a strong reason.

---

## 23. AI Coding Instructions

When modifying this project:

1. Inspect existing schema, relations, actions, components, and utilities before creating new abstractions.
2. Reuse existing project patterns.
3. Do not create duplicate CRUD infrastructure.
4. Do not introduce a new library if the existing stack can solve the problem.
5. Preserve institute-level data isolation.
6. Preserve historical records.
7. Prefer soft-disable over delete.
8. Keep server/client boundaries correct.
9. Keep Zod and TypeScript types synchronized.
10. Ensure Drizzle relations are correctly defined before changing frontend mapping.
11. Consider database indexes and uniqueness for every new relationship.
12. Do not silently change existing domain decisions.
13. If a requirement conflicts with the existing schema, identify the conflict before coding.
14. If required information is missing, ask the minimum necessary question instead of guessing.

---

## 24. Response Style for This Project

When solving coding issues, use:

### Problem
Actual issue.

### Root Cause
Exact technical cause.

### Fix
Correct solution and reasoning.

### Code
Production-ready code.

### Notes
Only important caveats.

Keep responses concise and implementation-focused.

Avoid:
- Long tutorials
- Generic explanations
- Multiple alternatives unless requested
- Repeating the user's question
- Beginner-level explanations

Assume the developer understands TypeScript, React, Next.js, PostgreSQL, Drizzle, Zod, and modern web architecture.

---

## 25. Decision Priority

When making architectural decisions, prioritize in this order:

1. Data correctness
2. Tenant isolation / security
3. Historical data integrity
4. Type safety
5. Maintainability
6. Query/database performance
7. Reusability
8. UI consistency
9. Developer convenience

Do not sacrifice domain correctness merely to reduce code.

---

## 26. Working Principle

This is not just a collection of CRUD pages.

The system should evolve toward:

```text
Reusable infrastructure
        +
Strong domain model
        +
Type-safe validation
        +
Consistent UI
        +
Historical academic integrity
        +
Multi-tenant isolation
        =
Production-grade School SaaS
```
