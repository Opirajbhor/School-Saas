import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sectionClassTeachers } from "../db/schema/teacher-assignment.drizzle";
import { classesType, sectionType, sectionTypeWithId } from "./classes.zod";
import { editTeacherType, Teacherlist } from "./teacher.zod";

// Insert validation
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
