import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  sectionClassTeachers,
  sectionSubjectTeachers,
} from "../db/schema/teacher-assignment.drizzle";
import { classesType, sectionType, sectionTypeWithId } from "./classes.zod";
import { editTeacherType, Teacherlist } from "./teacher.zod";
import { OutputSubAssignType, outputSubjectType } from "./subjects.zod";
import { outputGroupType } from "./groups.zod";

// ------------------- class Teacher Zod Validation --------------
export const sectionClassTeacherZod = createInsertSchema(sectionClassTeachers)
  .pick({
    sectionId: true,
    teacherId: true,
    status: true,
  })
  .extend({
    classId: z.uuid("Invalid class id"),
  });

export type InputClassTeacherType = z.infer<typeof sectionClassTeacherZod>;

export type OutputClassTeacherType = InputClassTeacherType & {
  id: string;
  name: string;
  sections: sectionType[];
  teachers: Teacherlist[];
};
// Select validation
export const selectSectionClassTeacherZod =
  createSelectSchema(sectionClassTeachers);

export type classTeacherType = z.infer<typeof selectSectionClassTeacherZod> & {
  class: classesType;
  section: sectionTypeWithId;
  teacher: editTeacherType;
};

// -----------------subject search zod ------------
export const classSubjectGroupZod = z.object({
  classId: z.uuid("Invalid Class id"),
  sectionId: z.uuid("Invalid Section id"),
  groupId: z.uuid("Invalid Group id"),
});
export type classSubjectGroupType = z.infer<typeof classSubjectGroupZod>;
// ------------------- Subject Teacher Zod Validation --------------

export const subjectTeacherZod = z.object({
  teacherId: z.uuid("Invalid Teacher id"),
});

export type InputSubjectTeacherType = z.input<typeof subjectTeacherZod>;

// subect teacher assign type
type GroupClass = {
  id: string;
  instituteId: string;
  groupId: string;
  classId: string;
  group: outputGroupType;
};

export type ClassSectionType = {
  id: string;
  instituteId: string;
  sessionId: string;
  userId: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
  groupClasses: GroupClass[];
  sections: sectionType[];
};

export type ClassSubjectType = OutputSubAssignType & {
  subject: outputSubjectType;
};
