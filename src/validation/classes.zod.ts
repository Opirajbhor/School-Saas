import { z } from "zod";
import { statusEnumValues } from "./subjects.zod";
import { outputGroupType } from "./groups.zod";
import { createInsertSchema } from "drizzle-zod";
import { classesDrizzle } from "../drizzle-DB/schema";

export const classesZod = createInsertSchema(classesDrizzle).omit({
  instituteId: true,
  sessionId: true,
});

export type classesType = z.infer<typeof classesZod>;

export type classesTypeWithId = classesType & {
  id?: string;
  sessionId: string;
  sections?: sectionType[];
};

// section
export const sectionZod = z.object({
  name: z.string().trim().min(1, "section name is required").max(100),
  sessionId: z.string({
    message: "Session is required",
  }),
  classId: z.string({
    message: "class is required",
  }),
  status: z.enum(statusEnumValues).default("ACTIVE"),
});

export type SectionInputType = z.input<typeof sectionZod>;

export type sectionType = SectionInputType & {
  id?: string;
  status?: string;
};

// for classes and nested groups in the server action-------
export type ClassesWithGroups = classesType & {
  id: string;
  groups: outputGroupType[];
};

// -----------class with section

export type ClassWithSectionType = classesType & {
  sections: sectionType[];
};
