"use server";
import { enrollments, student } from "@/src/drizzle-DB/schema";
import { readMany } from "@/src/server-actions/crud-funtions/server-read-crud";
import { toggleStatus } from "@/src/server-actions/crud-funtions/server-status.action";
import { and, eq } from "drizzle-orm";
import { requireInstitute } from "../../profile/_actions/get-institute-profile";
import { db } from "@/src/drizzle-DB";
import {
  AddStudentType,
  addStudentZod,
  EditStudentType,
  editStudentZod,
} from "@/src/validation/student.zod";
import { getActiveSession } from "../../academic-sessions/_actions/session.action";
import { getClassSectionGroups } from "../../classes/_actions/classes.action";
import { createAuditLog } from "@/src/server-actions/audit-logs/createAuditLog.action";
import { getUserContext } from "@/src/server-actions/shared/get-user-context.action";

// get student
export async function getStudents() {
  try {
    const result = await readMany({
      drizzleSchema: enrollments,
      query: ({ db, instituteId }) =>
        db.query.enrollments.findMany({
          where: eq(enrollments.instituteId, instituteId),
          with: {
            student: true,
            class: true,
            section: true,
            session: true,
            group: true,
          },
        }),
    });

    return {
      success: true as const,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false as const,
      error: String(error),
      details: {},
    };
  }
}

// counts for the stat cards. one query, folded in memory — the enrollment list
// is already small enough that four round trips would only add latency.
export async function getStudentStats() {
  try {
    const result = await readMany({
      drizzleSchema: enrollments,
      query: ({ db, instituteId }) =>
        db
          .select({
            status: enrollments.status,
            classId: enrollments.classId,
            sectionId: enrollments.sectionId,
          })
          .from(enrollments)
          .where(eq(enrollments.instituteId, instituteId)),
    });

    const rows = (result.data ?? []) as {
      status: string;
      classId: string;
      sectionId: string;
    }[];

    return {
      success: true as const,
      data: {
        total: rows.length,
        active: rows.filter((row) => row.status === "ACTIVE").length,
        inactive: rows.filter((row) => row.status === "INACTIVE").length,
        classes: new Set(rows.map((row) => row.classId)).size,
        sections: new Set(rows.map((row) => row.sectionId)).size,
      },
    };
  } catch (error) {
    console.error("Failed to load student stats:", error);
    return {
      success: false as const,
      error: "Failed to fetch student stats",
      details: {},
    };
  }
}

// toogle Status
export async function ToggleStudentStatus(id: string) {
  return toggleStatus(
    {
      drizzleSchema: enrollments,
      entity: "STUDENT",
    },
    id,
  );
}
// get academicInfo
export async function getAcademicInfo() {
  try {
    const currentSession = await getActiveSession();
    const academicInfo = await getClassSectionGroups();
    return {
      success: true as const,
      data: {
        session: currentSession,
        classes: academicInfo?.data,
      },
    };
  } catch (error) {
    console.error(
      "failed to get the Academic Info--------",
      error,
      "--------------",
    );
    return {
      success: false as const,
      error: "Failed to fetch list.",
    };
  }
}

// register student

export async function addStudent(data: AddStudentType) {
  try {
    // Validate data
    const validated = addStudentZod.safeParse(data);
    if (!validated.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: validated.error.flatten().fieldErrors,
      };
    }
    // insert the parsed values, not the raw input: parsing normalises optional
    // fields (a blank birth certificate number becomes null)
    const values = validated.data;
    const activeSession = await getActiveSession();
    if (!activeSession) {
      return {
        success: false as const,
        error: "No active session",
        details: {},
      };
    }
    const profile = await requireInstitute();

    // Use transaction
    const result = await db.transaction(async (tx) => {
      // Insert student
      const [newStudent] = await tx
        .insert(student)
        .values({
          instituteId: profile.id,
          studentId: values.studentId,
          englishName: values.englishName,
          fatherName: values.fatherName,
          motherName: values.motherName,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          religion: values.religion,
          phone: values.phone,
          address: values.address,
          status: values.status,
          banglaName: values.banglaName,
          photoUrl: values.photoUrl || "",
          birthCertificateNo: values.birthCertificateNo,
          groupId: values.groupId || null,
        })
        .returning();

      // Insert enrollment - if this fails, student is rolled back
      const [enrollment] = await tx
        .insert(enrollments)
        .values({
          instituteId: profile.id,
          studentId: newStudent.id,
          sessionId: activeSession.id,
          classId: values.className,
          sectionId: values.section,
          roll: values.roll,
          groupId: values.groupId,
        })
        .returning();

      return {
        ...newStudent,
        enrollment,
      };
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error("Failed to add student:", error);
    return {
      success: false as const,
      error: "Failed to create student and enrollment",
      details: {},
    };
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// get one enrollment with its full student row, for the view/edit pages.
// Scoped by instituteId — the id comes from the URL, so it must never be
// trusted on its own.
export async function getStudentEnrollment(id: string) {
  try {
    // a malformed uuid makes Postgres throw, so reject it before querying
    if (!UUID_RE.test(id)) {
      return {
        success: false as const,
        error: "Student not found",
        details: {},
      };
    }

    const profile = await requireInstitute();
    const record = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.id, id),
        eq(enrollments.instituteId, profile.id),
      ),
      with: {
        student: true,
        class: true,
        section: true,
        session: true,
        group: true,
      },
    });

    if (!record) {
      return {
        success: false as const,
        error: "Student not found",
        details: {},
      };
    }

    return {
      success: true as const,
      data: record,
    };
  } catch (error) {
    console.error("Failed to load student:", error);
    return {
      success: false as const,
      error: "Failed to fetch student",
      details: {},
    };
  }
}

// update a student and their enrollment together
export async function updateStudent(id: string, data: EditStudentType) {
  try {
    if (!UUID_RE.test(id)) {
      return {
        success: false as const,
        error: "Student not found",
        details: {},
      };
    }

    const validated = editStudentZod.safeParse(data);
    if (!validated.success) {
      return {
        success: false as const,
        error: "Validation failed",
        details: validated.error.flatten().fieldErrors,
      };
    }
    const values = validated.data;

    const profile = await requireInstitute();
    const userCtx = await getUserContext();

    // re-read scoped first: the student id must come from our own row, never
    // from the client, or one institute could edit another's student
    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.id, id),
        eq(enrollments.instituteId, profile.id),
      ),
      columns: { id: true, studentId: true },
    });

    if (!existing) {
      return {
        success: false as const,
        error: "Student not found",
        details: {},
      };
    }

    const result = await db.transaction(async (tx) => {
      await tx
        .update(student)
        .set({
          studentId: values.studentId,
          englishName: values.englishName,
          banglaName: values.banglaName,
          fatherName: values.fatherName,
          motherName: values.motherName,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          religion: values.religion,
          phone: values.phone,
          photoUrl: values.photoUrl || null,
          birthCertificateNo: values.birthCertificateNo,
          address: values.address,
          groupId: values.groupId || null,
        })
        .where(
          and(
            eq(student.id, existing.studentId),
            eq(student.instituteId, profile.id),
          ),
        );

      // the enrollment's session is fixed; only placement fields change
      const [enrollment] = await tx
        .update(enrollments)
        .set({
          classId: values.className,
          sectionId: values.section,
          roll: values.roll,
          groupId: values.groupId || null,
        })
        .where(
          and(
            eq(enrollments.id, id),
            eq(enrollments.instituteId, profile.id),
          ),
        )
        .returning();

      if (userCtx) {
        await createAuditLog(tx, {
          instituteId: profile.id,
          userId: userCtx.userId,
          action: "UPDATED",
          entity: "STUDENT",
          entityId: existing.studentId,
        });
      }

      return enrollment;
    });

    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    console.error("Failed to update student:", error);

    // surface the real cause for the unique constraints rather than a generic
    // failure, since duplicate student ids are an easy mistake to make
    const message = String(error);
    if (message.includes("student_unique_per_institute")) {
      return {
        success: false as const,
        error: "That Student ID is already in use",
        details: {},
      };
    }

    return {
      success: false as const,
      error: "Failed to update student",
      details: {},
    };
  }
}
