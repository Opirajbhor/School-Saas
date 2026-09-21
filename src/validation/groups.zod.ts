import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { groups } from "../drizzle-DB/schema";

// export const addGroupZod = createSelectSchema(groups);
export const addGroupZod = createInsertSchema(groups).omit({
  instituteId: true,
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type inputGroupType = z.infer<typeof addGroupZod>;

export type outputGroupType = inputGroupType & {
  id: string;
  instituteId: string;
};

// assign to class

export const assignGroupClassZod = z.object({
  groupId: z.uuid("Invalid group id"),

  classIds: z
    .array(z.uuid("Invalid class id"))
    .min(1, "Select at least one class"),
});

export type AssignGroupClassType = z.infer<typeof assignGroupClassZod>;

export type OutputGroupClassType = {
  id: string;
  instituteId: string;
  name: string;
  status: string;
  groupClasses: {
    id: string;
    groupId: string;
    group: {
      name: string;
      id: string;
    };
    name: string;
    classId: string;
  }[];
};
