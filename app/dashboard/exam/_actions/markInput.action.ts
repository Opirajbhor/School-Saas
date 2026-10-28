"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { parseWithZod } from "@/src/validation/validator.zod";
import { db } from "@/src/drizzle-DB";
import {
  classesDrizzle,
  enrollments,
  examClasses,
  examMarkTypesDrizzle,
  examMarks,
  exams,
  sectionClassTeachers,
  sectionDrizzle,
  student,
  subjectAssignSchema,
  subjectDbSchema,
  subjectMarkTemplates,
  teachers,
} from "@/src/drizzle-DB/schema";
import {
  examMarkColumnsZod,
  InputExamMarkColumnsType,
  InputMarkInputSheetType,
  markInputSheetZod,
  OutputMarkEntrySheetType,
} from "../_schema/exam.zod";

// selected row shapes returned by the joins below
type ExamRow = { id: string; name: string };
type OptionRow = { id: string; name: string };
type StudentRow = {
  studentId: string;
  roll: string;
  englishName: string;
  banglaName: string | null;
};
type TeacherRow = { id: string; nameEnglish: string };
type MarkTypeRow = {
  id: string;
  name: string;
  fullMark: number;
  passMark: number;
};

// ================== selectors ==================

// exams assigned to a class of the current institute
// rows with a null instituteId are global defaults
const instituteScope = (instituteId: string) =>
  or(isNull(examClasses.instituteId), eq(examClasses.instituteId, instituteId));

export async function getExamOptions() {
  return readMany({
    drizzleSchema: exams,
    query: ({ db, instituteId }) =>
      db
        .selectDistinct({ id: exams.id, name: exams.name })
        .from(exams)
        .innerJoin(
          examClasses,
          and(
            eq(examClasses.examId, exams.id),
            instituteScope(instituteId),
            eq(examClasses.status, "ACTIVE"),
          ),
        )
        .where(
          and(
            eq(exams.status, "ACTIVE"),
            or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
          ),
        )
        .orderBy(asc(exams.name)),
  });
}

// classes the exam is assigned to
export async function getExamClassOptions(examId: string) {
  return readMany({
    drizzleSchema: examClasses,
    query: ({ db, instituteId }) =>
      db
        .select({ id: classesDrizzle.id, name: classesDrizzle.name })
        .from(examClasses)
        .innerJoin(classesDrizzle, eq(classesDrizzle.id, examClasses.classId))
        .where(
          and(
            eq(examClasses.examId, examId),
            instituteScope(instituteId),
            eq(examClasses.status, "ACTIVE"),
            eq(classesDrizzle.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(classesDrizzle.name)),
  });
}

// sections + subjects of a class, to fill the step-2 dropdowns
export async function getExamClassFilters(classId: string) {
  const sections = await readMany({
    drizzleSchema: sectionDrizzle,
    query: ({ db, instituteId }) =>
      db
        .select({ id: sectionDrizzle.id, name: sectionDrizzle.name })
        .from(sectionDrizzle)
        .where(
          and(
            eq(sectionDrizzle.classId, classId),
            eq(sectionDrizzle.instituteId, instituteId),
            eq(sectionDrizzle.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(sectionDrizzle.name)),
  });

  const subjects = await readMany({
    drizzleSchema: subjectAssignSchema,
    query: ({ db, instituteId }) =>
      db
        .select({ id: subjectDbSchema.id, name: subjectDbSchema.name })
        .from(subjectAssignSchema)
        .innerJoin(
          subjectDbSchema,
          eq(subjectDbSchema.id, subjectAssignSchema.subjectId),
        )
        .where(
          and(
            eq(subjectAssignSchema.classId, classId),
            eq(subjectAssignSchema.status, "ACTIVE"),
            or(
              isNull(subjectAssignSchema.instituteId),
              eq(subjectAssignSchema.instituteId, instituteId),
            ),
            or(
              isNull(subjectDbSchema.instituteId),
              eq(subjectDbSchema.instituteId, instituteId),
            ),
          ),
        )
        .orderBy(asc(subjectDbSchema.name)),
  });

  if (!sections.success || !subjects.success) {
    return {
      success: false as const,
      error: "Failed to load sections and subjects",
      details: {},
    };
  }

  return {
    success: true as const,
    data: {
      sections: sections.data as OptionRow[],
      subjects: subjects.data as OptionRow[],
    },
  };
}

// ================== mark entry sheet ==================

// everything the mark sheet needs for one exam/class/section/subject
export async function getExamMarkSheet(data: InputExamMarkColumnsType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }

  const parsed = parseWithZod(examMarkColumnsZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, classId, sectionId, subjectId } = parsed.data;

  try {
    const examResult = await readMany({
      drizzleSchema: exams,
      query: ({ db, instituteId }) =>
        db
          .select({ id: exams.id, name: exams.name })
          .from(exams)
          .innerJoin(
            examClasses,
            and(
              eq(examClasses.examId, exams.id),
              eq(examClasses.classId, classId),
              instituteScope(instituteId),
              eq(examClasses.status, "ACTIVE"),
            ),
          )
          .where(
            and(
              eq(exams.id, examId),
              or(isNull(exams.instituteId), eq(exams.instituteId, instituteId)),
            ),
          )
          .limit(1),
    });

    const classResult = await readMany({
      drizzleSchema: classesDrizzle,
      query: ({ db, instituteId }) =>
        db
          .select({ id: classesDrizzle.id, name: classesDrizzle.name })
          .from(classesDrizzle)
          .where(
            and(
              eq(classesDrizzle.id, classId),
              or(
                isNull(classesDrizzle.instituteId),
                eq(classesDrizzle.instituteId, instituteId),
              ),
            ),
          )
          .limit(1),
    });

    const filters = await getExamClassFilters(classId);

    const [markTypes, students, classTeacher] = await Promise.all([
      getSubjectMarkTypes(subjectId, ctx.instituteId),
      getSectionStudents(classId, sectionId),
      getClassTeacher(classId, sectionId),
    ]);

    const exam = (examResult.data as ExamRow[])?.[0];
    const classRow = (classResult.data as OptionRow[])?.[0];

    if (!exam) {
      return {
        success: false as const,
        error: "This exam is not assigned to the selected class",
        details: {},
      };
    }
    if (!classRow) {
      return { success: false as const, error: "Class not found", details: {} };
    }
    if (!filters.success) {
      return {
        success: false as const,
        error: "Failed to load sections and subjects",
        details: {},
      };
    }
    if (!markTypes.success) {
      return {
        success: false as const,
        error: markTypes.error,
        details: markTypes.details,
      };
    }
    if (!students.success || !classTeacher.success) {
      return {
        success: false as const,
        error: "Failed to load mark entry data",
        details: {},
      };
    }

    const section = filters.data.sections.find((item) => item.id === sectionId);
    if (!section) {
      return {
        success: false as const,
        error: "Section not found in this class",
        details: {},
      };
    }
    const subject = filters.data.subjects.find((item) => item.id === subjectId);
    if (!subject) {
      return {
        success: false as const,
        error: "Subject is not assigned to this class",
        details: {},
      };
    }

    const markTypeRows = markTypes.data as MarkTypeRow[];
    const savedMarks = await getSavedMarks(examId, subjectId, ctx.instituteId);
    if (!savedMarks.success) {
      return {
        success: false as const,
        error: "Failed to load saved marks",
        details: {},
      };
    }

    const sheet: OutputMarkEntrySheetType = {
      exam,
      class: classRow,
      section,
      subject,
      sections: filters.data.sections,
      subjects: filters.data.subjects,
      classTeacher: classTeacher.data,
      markTypes: markTypeRows,
      totalMarks: markTypeRows.reduce((sum, type) => sum + type.fullMark, 0),
      rows: (students.data as StudentRow[]).map((row) => ({
        ...row,
        status: savedMarks.data.has(row.studentId) ? "PENDING" : null,
        marks: markTypeRows.map((type) => ({
          markTypeId: type.id,
          mark: savedMarks.data.get(row.studentId)?.get(type.id)?.mark ?? 0,
          absent:
            savedMarks.data.get(row.studentId)?.get(type.id)?.absent ?? false,
        })),
      })),
    };

    return { success: true as const, data: sheet };
  } catch (error) {
    console.error("Failed to load mark entry sheet:", error);
    return {
      success: false as const,
      error: "Failed to load mark entry data",
      details: {},
    };
  }
}

// ================== save ==================

// validates the sheet against the subject's mark config and the section
// enrollment, then upserts one row per student / mark type.
export async function saveMarkInput(data: InputMarkInputSheetType) {
  const ctx = await getUserContext();
  if (!ctx) {
    return {
      success: false as const,
      error: "No User session found",
      details: {},
    };
  }
  const { userId, instituteId } = ctx;

  const parsed = parseWithZod(markInputSheetZod, data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error,
      details: parsed.details,
    };
  }
  const { examId, classId, sectionId, subjectId, rows } = parsed.data;

  const studentIds = rows.map((row) => row.studentId);
  if (new Set(studentIds).size !== studentIds.length) {
    return {
      success: false as const,
      error: "Duplicate student rows",
      details: {},
    };
  }

  try {
    const [markTypes, enrolled] = await Promise.all([
      getSubjectMarkTypes(subjectId, instituteId),
      readMany({
        drizzleSchema: enrollments,
        query: ({ db, instituteId }) =>
          db
            .select({ id: enrollments.id, studentId: enrollments.studentId })
            .from(enrollments)
            .where(
              and(
                eq(enrollments.instituteId, instituteId),
                eq(enrollments.classId, classId),
                eq(enrollments.sectionId, sectionId),
                eq(enrollments.status, "ACTIVE"),
                inArray(enrollments.studentId, studentIds),
              ),
            ),
      }),
    ]);

    if (!markTypes.success) {
      return {
        success: false as const,
        error: markTypes.error,
        details: markTypes.details,
      };
    }
    if (!enrolled.success) {
      return {
        success: false as const,
        error: "Failed to verify students",
        details: {},
      };
    }

    const enrolledRows = enrolled.data as { id: string; studentId: string }[];
    const enrollmentByStudent = new Map(
      enrolledRows.map((row) => [row.studentId, row.id]),
    );
    if (enrolledRows.length !== studentIds.length) {
      return {
        success: false as const,
        error: "Some students are not enrolled in this section",
        details: {},
      };
    }

    const markTypeRows = markTypes.data as MarkTypeRow[];
    for (const row of rows) {
      if (row.absent) continue;

      for (const entry of row.marks) {
        const markType = markTypeRows.find(
          (type) => type.id === entry.markTypeId,
        );
        if (!markType) {
          return {
            success: false as const,
            error: "Mark type is not configured for this subject",
            details: {},
          };
        }
        if (entry.mark > markType.fullMark) {
          return {
            success: false as const,
            error: `${markType.name} mark cannot exceed ${markType.fullMark}`,
            details: {},
          };
        }
      }
    }

    const values = rows.flatMap((row) => {
      const enrollmentId = enrollmentByStudent.get(row.studentId);
      if (!enrollmentId) return [];

      return row.marks.map((entry) => ({
        instituteId,
        examId,
        enrollmentId,
        subjectId,
        markTypeId: entry.markTypeId,
        mark: row.absent ? 0 : Math.round(entry.mark),
        absent: row.absent,
      }));
    });

    await db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx
          .insert(examMarks)
          .values(values)
          .onConflictDoUpdate({
            target: [
              examMarks.examId,
              examMarks.enrollmentId,
              examMarks.subjectId,
              examMarks.markTypeId,
            ],
            set: {
              mark: sql`excluded.mark`,
              absent: sql`excluded.absent`,
              status: "ACTIVE",
              updatedAt: new Date(),
            },
          });
      }

      await createAuditLog(tx, {
        instituteId,
        userId,
        action: "UPDATED",
        entity: "MARK",
        entityId: examId,
        description: `saved marks for ${rows.length} students`,
        metadata: {
          examId,
          classId,
          sectionId,
          subjectId,
          rows: rows.length,
        },
      });
    });

    revalidatePath("/dashboard/exam/mark-input");
    revalidatePath(`/dashboard/exam/mark-entry/${examId}`);

    return {
      success: true as const,
      data: {
        examId,
        classId,
        sectionId,
        subjectId,
        savedRows: rows.length,
        absentRows: rows.filter((row) => row.absent).length,
      },
    };
  } catch (error) {
    console.error("Failed to save marks:", error);
    return {
      success: false as const,
      error: "Failed to save marks",
      details: {},
    };
  }
}

// ================== helpers ==================

// mark types (CQ, MCQ, …) configured for a subject, tenant or global defaults.
// `subject_mark_templates` has no instituteId (it hangs off the subject), so it
// can't go through readMany — the subject is verified institute-scoped here
// before its templates are read.
async function getSubjectMarkTypes(subjectId: string, instituteId: string) {
  const subject = await db
    .select({ id: subjectDbSchema.id })
    .from(subjectDbSchema)
    .where(
      and(
        eq(subjectDbSchema.id, subjectId),
        eq(subjectDbSchema.status, "ACTIVE"),
        or(
          isNull(subjectDbSchema.instituteId),
          eq(subjectDbSchema.instituteId, instituteId),
        ),
      ),
    )
    .limit(1);

  if (!subject[0]) {
    return {
      success: false as const,
      error: "Subject not found",
      details: {},
    };
  }

  const rows = await db
    .select({
      id: examMarkTypesDrizzle.id,
      name: examMarkTypesDrizzle.name,
      fullMark: subjectMarkTemplates.fullMark,
      passMark: subjectMarkTemplates.passMark,
    })
    .from(subjectMarkTemplates)
    .innerJoin(
      examMarkTypesDrizzle,
      eq(examMarkTypesDrizzle.id, subjectMarkTemplates.markTypeId),
    )
    .where(
      and(
        eq(subjectMarkTemplates.subjectId, subjectId),
        eq(subjectMarkTemplates.status, "ACTIVE"),
        eq(examMarkTypesDrizzle.status, "ACTIVE"),
        or(
          isNull(examMarkTypesDrizzle.instituteId),
          eq(examMarkTypesDrizzle.instituteId, instituteId),
        ),
      ),
    )
    .orderBy(asc(examMarkTypesDrizzle.createdAt));

  return { success: true as const, data: rows, details: {} };
}

// active students enrolled in the section, ordered by roll
async function getSectionStudents(classId: string, sectionId: string) {
  return readMany({
    drizzleSchema: enrollments,
    query: ({ db, instituteId }) =>
      db
        .select({
          studentId: student.id,
          roll: enrollments.roll,
          englishName: student.englishName,
          banglaName: student.banglaName,
        })
        .from(enrollments)
        .innerJoin(student, eq(student.id, enrollments.studentId))
        .where(
          and(
            eq(enrollments.instituteId, instituteId),
            eq(enrollments.classId, classId),
            eq(enrollments.sectionId, sectionId),
            eq(enrollments.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(enrollments.roll)),
  });
}

// saved marks for this exam + subject, keyed by studentId -> markTypeId
async function getSavedMarks(
  examId: string,
  subjectId: string,
  instituteId: string,
) {
  const rows = await db
    .select({
      studentId: enrollments.studentId,
      markTypeId: examMarks.markTypeId,
      mark: examMarks.mark,
      absent: examMarks.absent,
    })
    .from(examMarks)
    .innerJoin(enrollments, eq(enrollments.id, examMarks.enrollmentId))
    .where(
      and(
        eq(examMarks.instituteId, instituteId),
        eq(examMarks.examId, examId),
        eq(examMarks.subjectId, subjectId),
        eq(examMarks.status, "ACTIVE"),
      ),
    );

  const byStudent = new Map<
    string,
    Map<string, { mark: number; absent: boolean }>
  >();
  for (const row of rows) {
    const perType = byStudent.get(row.studentId) ?? new Map();
    perType.set(row.markTypeId, { mark: row.mark, absent: row.absent });
    byStudent.set(row.studentId, perType);
  }

  return { success: true as const, data: byStudent, details: {} };
}

// the class teacher assigned to the section
async function getClassTeacher(classId: string, sectionId: string) {
  const result = await readMany({
    drizzleSchema: sectionClassTeachers,
    query: ({ db, instituteId }) =>
      db
        .select({ id: teachers.id, nameEnglish: teachers.nameEnglish })
        .from(sectionClassTeachers)
        .innerJoin(teachers, eq(teachers.id, sectionClassTeachers.teacherId))
        .where(
          and(
            eq(sectionClassTeachers.instituteId, instituteId),
            eq(sectionClassTeachers.classId, classId),
            eq(sectionClassTeachers.sectionId, sectionId),
            eq(sectionClassTeachers.status, "ACTIVE"),
            eq(teachers.status, "ACTIVE"),
          ),
        )
        .limit(1),
  });

  if (!result.success) {
    return { success: false as const, data: null };
  }
  return {
    success: true as const,
    data: (result.data as TeacherRow[])[0] ?? null,
  };
}
