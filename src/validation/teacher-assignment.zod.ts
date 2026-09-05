import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  sectionClassTeachers,
  sectionSubjectTeachers,
} from "../db/schema/teacher-assignment.drizzle";
import { classesType, sectionType, sectionTypeWithId } from "./classes.zod";
import { editTeacherType, Teacherlist } from "./teacher.zod";
import { OutputSubAssignType } from "./subjects.zod";
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

// ------------------- Subject Teacher Zod Validation --------------

export const subjectTeacherZod = createInsertSchema(sectionSubjectTeachers)
  .pick({
    sectionId: true,
  })
  .extend({
    classId: z.uuid("Invalid class id"),
  });

export type InputSubjectTeacherType = z.infer<typeof subjectTeacherZod>;
export const selectSubjectTeacherZod = createSelectSchema(
  sectionSubjectTeachers,
);
export type OutputSubjectTeacherType = z.infer<
  typeof selectSectionClassTeacherZod
> & {
  class: classesType;
  section: sectionTypeWithId;
  subject: OutputSubAssignType;
  teacher: editTeacherType;
};

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

  sections: sectionType[];
};
