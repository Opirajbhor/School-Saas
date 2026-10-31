import { z } from "zod";
import { academicSessionType } from "./academicSessions.zod";
import { classesType, sectionType } from "./classes.zod";
import { outputGroupType } from "./groups.zod";

export const addStudentZod = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required")
    .max(30, "Student ID cannot exceed 30 characters"),

  englishName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  fatherName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  motherName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),

  banglaName: z
    .union([z.string().trim().max(200, "Bangla name is too long"), z.null()])
    .optional()
    .transform((value) => value || null),

  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "Please select a gender",
  }),

  dateOfBirth: z.coerce.date({
    error: "Invalid date of birth",
  }),

  religion: z.string().trim().max(50, "Religion is too long"),

  phone: z
    .string()
    .trim()
    .regex(/^(\+8801|01)[3-9]\d{8}$/, "Invalid mobile number"),

  photoUrl: z
    .union([
      z.string().trim().url("Invalid photo URL"),
      z.literal(""),
      z.null(),
    ])
    .optional(),

  // optional: a blank input arrives as "" and is normalised to null so the
  // column holds one "not provided" value instead of mixing "" and null
  birthCertificateNo: z
    .union([z.string().trim().max(50), z.null()])
    .optional()
    .transform((value) => value || null),

  address: z.string().trim().max(500),
  sessionId: z.uuid().nullable(),
  className: z.string().trim().max(500),
  section: z.string().trim().max(500),
  roll: z.string().trim().max(500),
  // optional: a missing group arrives as "" from the select, which is not a
  // uuid, so blank is normalised to null
  groupId: z
    .union([z.uuid(), z.literal(""), z.null()])
    .optional()
    .transform((value) => value || null),

  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type AddStudentType = z.infer<typeof addStudentZod>;

// Same field rules as creation, but only the parts that are editable: the
// enrolment's session is fixed, and dates arrive as "YYYY-MM-DD" from the
// date input. `studentId`, `className`, `section` and `roll` are enrolment or
// identity fields that stay editable, while sessionId is not accepted at all.
export const editStudentZod = addStudentZod
  .omit({ sessionId: true, photoUrl: true })
  .extend({
    photoUrl: addStudentZod.shape.photoUrl,
    // an <input type="date"> always sends a string, and empty means unchanged
    dateOfBirth: z.coerce.date({ error: "Invalid date of birth" }),
    className: z.string().trim().min(1, "Class is required"),
    section: z.string().trim().min(1, "Section is required"),
    roll: z
      .string()
      .trim()
      .min(1, "Roll is required")
      .max(10, "Roll cannot exceed 10 characters"),
  });

export type EditStudentType = z.infer<typeof editStudentZod>;
/**
 * What the form holds: the validated shape, except `dateOfBirth` is still the
 * raw "YYYY-MM-DD" string from the date input until zod coerces it on submit.
 * Optional-with-default fields are required here because the form always
 * supplies them, which `z.input` would otherwise mark undefined.
 */
export type EditStudentInput = Omit<EditStudentType, "dateOfBirth"> & {
  dateOfBirth: string;
  status: "ACTIVE" | "INACTIVE";
};

export type OutputStudentType = AddStudentType & {
  id: string;
};

export type AcademicSubjectType = {
  classId: string;
  subjectId: string;
  name: string;
  shortName: string;
  /** COMPULSORY or GROUP_BASED */
  type: string;
  isOptional: boolean;
  isReligion: boolean;
  groupId: string | null;
  groupName: string | null;
};

export type AcademicInfoType = {
  session: academicSessionType;
  classes: (classesType & {
    id: string;
    sections: sectionType[];
    groupClasses: {
      id: string;
      classId: string;
      group: outputGroupType;
    }[];
  })[];
  classSubjects: AcademicSubjectType[];
};

export type StudentEnrollment = {
  id: string;
  instituteId: string;
  roll: string;
  classId: string;
  sectionId: string;
  sessionId: string;
  studentId: string;
  status: "ACTIVE" | "INACTIVE";
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  session: {
    id: string;
    year: string;
  };
  group: {
    id: string;
    name: string;
  };

  student: {
    id: string;
    studentId: string;
    englishName: string;
    banglaName: string | null;
    fatherName: string | null;
    motherName: string | null;
    religion: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: Date;
  };
};

/**
 * A single enrolment with its full student row, for the view/edit pages.
 * Broader than `StudentEnrollment` because those pages show every stored
 * column, not just the ones the list table renders.
 */
export type StudentDetail = {
  id: string;
  instituteId: string;
  roll: string;
  classId: string;
  sectionId: string;
  sessionId: string;
  studentId: string;
  status: "ACTIVE" | "INACTIVE";
  class: {
    id: string;
    name: string;
  };
  section: {
    id: string;
    name: string;
  };
  session: {
    id: string;
    year: string;
  };
  group: {
    id: string;
    name: string;
  } | null;
  student: {
    id: string;
    studentId: string;
    englishName: string;
    banglaName: string | null;
    fatherName: string;
    motherName: string;
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: Date;
    religion: string;
    nationality: string;
    phone: string;
    email: string | null;
    photoUrl: string | null;
    birthCertificateNo: string | null;
    address: string;
    status: "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "LEFT";
  };
};
