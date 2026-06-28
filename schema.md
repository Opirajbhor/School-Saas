```ts
// src/db/schema/core.ts
import {
  pgTable,
  uuid,
  integer,
  numeric,
  text,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { instituteProfile, teachers, timestamps } from "./core";
import { students } from "./core";
import { exams } from "./exam";
import { subjects } from "./subject";

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// =========================
// COMMON COLUMNS
// =========================



// =========================
// ACADEMIC SESSION
// =========================

export const academicSession = pgTable(
  "academic_session",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),
    year: text("year").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    ...timestamps,
  },
  (table) => ({
    uniqueYear: uniqueIndex("session_year_unique").on(
      table.instituteId,
      table.year,
    ),
  }),
);

// =========================
// CLASS
// =========================

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),

  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),

  name: text("name").notNull(),

  ...timestamps,
});

// =========================
// SECTION
// =========================

export const sections = pgTable("sections", {
  id: uuid("id").defaultRandom().primaryKey(),

  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),

  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, {
      onDelete: "cascade",
    }),

  name: text("name").notNull(),

  ...timestamps,
});

// =========================
// STUDENT
// =========================

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    admissionNo: text("admission_no").notNull(),

    nameBangla: text("name_bangla").notNull(),
    nameEnglish: text("name_english").notNull(),

    fatherName: text("father_name").notNull(),
    motherName: text("mother_name").notNull(),

    dateOfBirth: date("date_of_birth").notNull(),

    gender: genderEnum("gender").notNull(),

    religion: religionEnum("religion").notNull(),

    mobile: text("mobile"),

    address: text("address").notNull(),

    photoUrl: text("photo_url"),

    status: statusEnum("status").default("ACTIVE").notNull(),

    ...timestamps,
  },
  (table) => ({
    admissionUnique: uniqueIndex("student_admission_unique").on(
      table.instituteId,
      table.admissionNo,
    ),
  }),
);

// =========================
// TEACHER
// =========================

export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),

  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id, {
      onDelete: "cascade",
    }),

  userId: text("user_id"),

  nameBangla: text("name_bangla").notNull(),
  nameEnglish: text("name_english").notNull(),

  designation: text("designation").notNull(),

  mobile: text("mobile").notNull(),

  email: text("email").notNull(),

  photoUrl: text("photo_url"),

  gender: genderEnum("gender").notNull(),

  status: statusEnum("status").default("ACTIVE").notNull(),

  ...timestamps,
});

// Continue with:
// enrollment
// subject
// classSubject
// subjectTeacher
// exam
// examSubject
// mark
// relations.ts
```

```ts
// subject.ts

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  instituteProfile,
  academicSession,
  classes,
  sections,
  teachers,
  students,
  timestamps,
} from "./core";

// =========================
// SUBJECT
// =========================

export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),
    code: text("code").notNull(),

    ...timestamps,
  },
  (table) => ({
    subjectCodeUnique: uniqueIndex("subject_code_unique").on(
      table.instituteId,
      table.code,
    ),
  }),
);

// =========================
// CLASS SUBJECT
// =========================

export const classSubjects = pgTable(
  "class_subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id),

    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),

    fullMarks: integer("full_marks").notNull(),
    passMarks: integer("pass_marks").notNull(),

    isOptional: boolean("is_optional").default(false).notNull(),

    ...timestamps,
  },
  (table) => ({
    uniqueClassSubject: uniqueIndex("unique_class_subject").on(
      table.classId,
      table.subjectId,
    ),
  }),
);

// =========================
// SUBJECT TEACHER
// =========================

export const subjectTeachers = pgTable("subject_teachers", {
  id: uuid("id").defaultRandom().primaryKey(),

  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id),

  academicSessionId: uuid("academic_session_id")
    .notNull()
    .references(() => academicSession.id),

  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id),

  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),

  sectionId: uuid("section_id")
    .notNull()
    .references(() => sections.id),

  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),

  ...timestamps,
});

// =========================
// ENROLLMENT
// =========================

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),

    academicSessionId: uuid("academic_session_id")
      .notNull()
      .references(() => academicSession.id),

    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id),

    roll: integer("roll").notNull(),

    ...timestamps,
  },
  (table) => ({
    uniqueEnrollment: uniqueIndex("unique_student_session").on(
      table.studentId,
      table.academicSessionId,
    ),
  }),
);
```

```ts
// exam.ts

import { pgTable, uuid, text, integer, date } from "drizzle-orm/pg-core";

import { instituteProfile, academicSession, classes, timestamps } from "./core";

import { subjects } from "./subject";

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),

  instituteId: uuid("institute_id")
    .notNull()
    .references(() => instituteProfile.id),

  academicSessionId: uuid("academic_session_id")
    .notNull()
    .references(() => academicSession.id),

  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id),

  name: text("name").notNull(),

  startDate: date("start_date"),
  endDate: date("end_date"),

  ...timestamps,
});

export const examSubjects = pgTable("exam_subjects", {
  id: uuid("id").defaultRandom().primaryKey(),

  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, {
      onDelete: "cascade",
    }),

  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),

  fullMarks: integer("full_marks").notNull(),

  passMarks: integer("pass_marks").notNull(),

  ...timestamps,
});
```

```ts
// mark.ts

export const marks = pgTable(
  "marks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id),

    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),

    createdByTeacherId: uuid("created_by_teacher_id").references(
      () => teachers.id,
    ),

    writtenMarks: integer("written_marks").default(0),

    mcqMarks: integer("mcq_marks").default(0),

    practicalMarks: integer("practical_marks").default(0),

    totalMarks: integer("total_marks").notNull(),

    grade: text("grade"),

    gradePoint: numeric("grade_point", {
      precision: 3,
      scale: 2,
    }),

    isPassed: boolean("is_passed").default(false).notNull(),

    isAbsent: boolean("is_absent").default(false).notNull(),

    ...timestamps,
  },
  (table) => ({
    uniqueMark: uniqueIndex("unique_exam_mark").on(
      table.examId,
      table.studentId,
      table.subjectId,
    ),
  }),
);
```
