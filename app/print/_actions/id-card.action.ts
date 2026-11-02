"use server";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/src/drizzle-DB";
import {
  enrollments,
  instituteProfile,
  student,
  teachers,
} from "@/src/drizzle-DB/schema";
import { requireInstitute } from "@/app/dashboard/profile/_actions/get-institute-profile";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CardInstitute = {
  nameEnglish: string;
  nameBangla: string;
  eiin: string;
  logo: string | null;
  /** head teacher signature image, printed above the signature line */
  signature: string | null;
  phone: string;
  upazila: string;
  district: string;
  division: string;
};

export type StudentCardData = {
  institute: CardInstitute;
  student: {
    id: string;
    studentId: string;
    englishName: string;
    banglaName: string | null;
    fatherName: string;
    motherName: string;
    gender: string;
    dateOfBirth: Date;
    religion: string;
    phone: string;
    photoUrl: string | null;
    address: string;
  };
  /** the enrolment the card is printed for — the active session when there is one */
  enrollment: {
    roll: string;
    className: string;
    sectionName: string;
    groupName: string | null;
    sessionYear: string;
  } | null;
};

export type TeacherCardData = {
  institute: CardInstitute;
  teacher: {
    id: string;
    nameEnglish: string;
    nameBangla: string;
    designation: string;
    mobile: string;
    email: string;
    gender: string;
    photoUrl: string | null;
  };
};

const toInstitute = (
  profile: typeof instituteProfile.$inferSelect,
): CardInstitute => ({
  nameEnglish: profile.nameEnglish,
  nameBangla: profile.nameBangla,
  eiin: profile.eiin,
  logo: profile.logo,
  signature: profile.signature,
  phone: profile.phone,
  upazila: profile.upazila,
  district: profile.district,
  division: profile.division,
});

/** One student's card, keyed by the student row (not the enrolment). */
export async function getStudentCard(studentId: string) {
  if (!UUID_RE.test(studentId)) {
    return { success: false as const, error: "Student not found" };
  }

  try {
    const profile = await requireInstitute();

    const record = await db.query.student.findFirst({
      where: and(
        eq(student.id, studentId),
        eq(student.instituteId, profile.id),
      ),
    });

    if (!record) {
      return { success: false as const, error: "Student not found" };
    }

    // newest enrolment first, but prefer the one in the active session
    const enrolments = await db.query.enrollments.findMany({
      where: eq(enrollments.studentId, studentId),
      with: { class: true, section: true, session: true, group: true },
    });

    const current =
      enrolments.find((row) => row.session?.status === "ACTIVE") ??
      enrolments.sort((a, b) =>
        String(b.session?.year ?? "").localeCompare(String(a.session?.year ?? "")),
      )[0] ??
      null;

    const data: StudentCardData = {
      institute: toInstitute(profile),
      student: {
        id: record.id,
        studentId: record.studentId,
        englishName: record.englishName,
        banglaName: record.banglaName,
        fatherName: record.fatherName,
        motherName: record.motherName,
        gender: record.gender,
        dateOfBirth: record.dateOfBirth,
        religion: record.religion,
        phone: record.phone,
        photoUrl: record.photoUrl,
        address: record.address,
      },
      enrollment: current
        ? {
            roll: current.roll,
            className: current.class?.name ?? "—",
            sectionName: current.section?.name ?? "—",
            groupName: current.group?.name ?? null,
            sessionYear: current.session?.year ?? "—",
          }
        : null,
    };

    return { success: true as const, data };
  } catch (error) {
    console.error("student card failed:", error);
    return { success: false as const, error: "Could not load student" };
  }
}

/** One teacher's card. */
export async function getTeacherCard(teacherId: string) {
  if (!UUID_RE.test(teacherId)) {
    return { success: false as const, error: "Teacher not found" };
  }

  try {
    const profile = await requireInstitute();

    const record = await db.query.teachers.findFirst({
      where: and(
        eq(teachers.id, teacherId),
        eq(teachers.instituteId, profile.id),
      ),
    });

    if (!record) {
      return { success: false as const, error: "Teacher not found" };
    }

    const data: TeacherCardData = {
      institute: toInstitute(profile),
      teacher: {
        id: record.id,
        nameEnglish: record.nameEnglish,
        nameBangla: record.nameBangla,
        designation: record.designation,
        mobile: record.mobile,
        email: record.email,
        gender: record.gender,
        photoUrl: record.photoUrl,
      },
    };

    return { success: true as const, data };
  } catch (error) {
    console.error("teacher card failed:", error);
    return { success: false as const, error: "Could not load teacher" };
  }
}

/** Every active student in a section, for a sheet of cards. */
export async function getSectionStudentCards(sectionId: string) {
  if (!UUID_RE.test(sectionId)) {
    return { success: false as const, error: "Section not found" };
  }

  try {
    const profile = await requireInstitute();

    const rows = await db.query.enrollments.findMany({
      where: and(
        eq(enrollments.sectionId, sectionId),
        eq(enrollments.instituteId, profile.id),
        eq(enrollments.status, "ACTIVE"),
      ),
      with: {
        student: true,
        class: true,
        section: true,
        session: true,
        group: true,
      },
    });

    const institute = toInstitute(profile);

    const cards: StudentCardData[] = rows
      .filter((row) => row.student)
      .map((row) => ({
        institute,
        student: {
          id: row.student.id,
          studentId: row.student.studentId,
          englishName: row.student.englishName,
          banglaName: row.student.banglaName,
          fatherName: row.student.fatherName,
          motherName: row.student.motherName,
          gender: row.student.gender,
          dateOfBirth: row.student.dateOfBirth,
          religion: row.student.religion,
          phone: row.student.phone,
          photoUrl: row.student.photoUrl,
          address: row.student.address,
        },
        enrollment: {
          roll: row.roll,
          className: row.class?.name ?? "—",
          sectionName: row.section?.name ?? "—",
          groupName: row.group?.name ?? null,
          sessionYear: row.session?.year ?? "—",
        },
      }))
      .sort((a, b) => Number(a.enrollment?.roll ?? 0) - Number(b.enrollment?.roll ?? 0));

    return { success: true as const, data: cards };
  } catch (error) {
    console.error("section cards failed:", error);
    return { success: false as const, error: "Could not load the section" };
  }
}

/** Every active teacher of the institute, for the bulk card sheet. */
export async function getTeacherCards() {
  try {
    const profile = await requireInstitute();

    const rows = await db.query.teachers.findMany({
      where: and(
        eq(teachers.instituteId, profile.id),
        eq(teachers.status, "ACTIVE"),
      ),
      orderBy: [asc(teachers.nameEnglish)],
    });

    const institute = toInstitute(profile);

    const cards: TeacherCardData[] = rows.map((row) => ({
      institute,
      teacher: {
        id: row.id,
        nameEnglish: row.nameEnglish,
        nameBangla: row.nameBangla,
        designation: row.designation,
        mobile: row.mobile,
        email: row.email,
        gender: row.gender,
        photoUrl: row.photoUrl,
      },
    }));

    return { success: true as const, data: cards };
  } catch (error) {
    console.error("teacher cards failed:", error);
    return { success: false as const, error: "Could not load teachers" };
  }
}
