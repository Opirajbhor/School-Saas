import { z } from "zod";
import { statusEnumValues } from "./subjects.zod";
import { outputGroupType } from "./groups.zod";
import { createInsertSchema } from "drizzle-zod";
import { classesDrizzle } from "../drizzle-DB/schema";

export const classesZod = createInsertSchema(classesDrizzle);
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
  groupClasses: {
    group: outputGroupType;
  }[];
};

// -----------class with section

export type ClassWithSectionType = classesType & {
  sections: sectionType[];
};

/**
 * Orders classes the way a school names them: by the number inside the name, so
 * "Class 6" comes before "Class 10". A plain `asc(name)` would sort
 * lexicographically and put "Class 10" first.
 *
 * The first number found in the name is used, which also covers "Class 6-A" and
 * "Grade 12". A name with no number counts as 0, so "Nursery" and "KG" sort
 * ahead of the numbered classes. Names with the same number fall back to a
 * locale compare so the order stays stable.
 */
export function compareClassName(
  a: { name: string },
  b: { name: string },
): number {
  const num = (name: string) => {
    const match = name.match(/\d+/);
    return match ? Number(match[0]) : 0;
  };

  const diff = num(a.name) - num(b.name);
  return diff !== 0 ? diff : a.name.localeCompare(b.name);
}
