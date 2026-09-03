import { pgTable, uuid } from "drizzle-orm/pg-core";
import { instituteProfile } from "./institute-profile-schema.drizzle";
import { academicSessions } from "./academic-session.drizzle";
import { unique } from "drizzle-orm/pg-core";
import { classesDrizzle, sectionDrizzle } from "./classes.drizzle";
import { teachers } from "./teacher.drizzle";
import { subjectDbSchema } from "./subjects.drizzle";
import { statusEnum, timestamps } from "./enums-drizzle";
import { relations } from "drizzle-orm";

// ----------class teacher Schema ----------------
export const sectionClassTeachers = pgTable(
  "section_class_teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id),

    classId: uuid("class_id")
      .notNull()
      .references(() => classesDrizzle.id),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => sectionDrizzle.id),

    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("section_class_teacher_unique").on(table.sectionId, table.sessionId),
  ],
);

// -------------- subject teacher Schema ------------
export const sectionSubjectTeachers = pgTable(
  "section_subject_teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    instituteId: uuid("institute_id")
      .notNull()
      .references(() => instituteProfile.id),

    sectionId: uuid("section_id")
      .notNull()
      .references(() => sectionDrizzle.id),

    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectDbSchema.id),

    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id),

    status: statusEnum("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (table) => [
    unique("section_subject_teacher_unique").on(
      table.sectionId,
      table.subjectId,
      table.sessionId,
    ),
  ],
);

// ---------- relations --------------

export const sectionClassTeacherRelations = relations(
  sectionClassTeachers,
  ({ one }) => ({
    class: one(classesDrizzle, {
      fields: [sectionClassTeachers.classId],
      references: [classesDrizzle.id],
    }),
    section: one(sectionDrizzle, {
      fields: [sectionClassTeachers.sectionId],
      references: [sectionDrizzle.id],
    }),

    teacher: one(teachers, {
      fields: [sectionClassTeachers.teacherId],
      references: [teachers.id],
    }),

    session: one(academicSessions, {
      fields: [sectionClassTeachers.sessionId],
      references: [academicSessions.id],
    }),

    institute: one(instituteProfile, {
      fields: [sectionClassTeachers.instituteId],
      references: [instituteProfile.id],
    }),
  }),
);

export const sectionRelations = relations(sectionDrizzle, ({ one, many }) => ({
  class: one(classesDrizzle, {
    fields: [sectionDrizzle.classId],
    references: [classesDrizzle.id],
  }),
  classTeacher: one(sectionClassTeachers),
  subjectTeachers: many(sectionSubjectTeachers),
}));

export const teacherRelations = relations(teachers, ({ many }) => ({
  classTeacherAssignments: many(sectionClassTeachers),

  subjectTeacherAssignments: many(sectionSubjectTeachers),
}));

export const sectionSubjectTeacherRelations = relations(
  sectionSubjectTeachers,
  ({ one }) => ({
    section: one(sectionDrizzle, {
      fields: [sectionSubjectTeachers.sectionId],
      references: [sectionDrizzle.id],
    }),

    subject: one(subjectDbSchema, {
      fields: [sectionSubjectTeachers.subjectId],
      references: [subjectDbSchema.id],
    }),

    teacher: one(teachers, {
      fields: [sectionSubjectTeachers.teacherId],
      references: [teachers.id],
    }),

    session: one(academicSessions, {
      fields: [sectionSubjectTeachers.sessionId],
      references: [academicSessions.id],
    }),

    institute: one(instituteProfile, {
      fields: [sectionSubjectTeachers.instituteId],
      references: [instituteProfile.id],
    }),
  }),
);
